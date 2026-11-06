"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Group, Modal, SegmentedControl, SimpleGrid, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconHash, IconWand } from "@tabler/icons-react";
import dayjs from "dayjs";
import { anchorPattern, slugify, type ModuleDefinition, type ModuleSettings, type PageModule } from "@/lib/page-modules";

const toDay = (iso?: string | null) => (iso ? dayjs(iso).format("YYYY-MM-DD") : null);

/** Name and section settings of one module */
export function SettingsModal({
	module: current,
	def,
	others,
	nameOf,
	pagePath,
	focus,
	onClose,
	onSave,
}: {
	module: PageModule | null;
	def?: ModuleDefinition;
	/** The page's other modules, for unique link names */
	others: PageModule[];
	nameOf: (m: PageModule) => string;
	pagePath: string;
	/** "name" opens it as a quick rename */
	focus: "name" | "settings";
	onClose: () => void;
	onSave: (patch: { name?: string; settings: ModuleSettings }) => void;
}) {
	const [name, setName] = useState("");
	const [s, setS] = useState<ModuleSettings>({});
	// Keep showing the last module while the modal animates closed
	const last = useRef(current);
	if (current) last.current = current;
	const module = last.current;

	useEffect(() => {
		if (!current) return;
		setName(current.name ?? "");
		setS({ ...current.settings });
	}, [current]);

	if (!module) return null;

	const anchor = s.anchor?.trim() ?? "";
	const taken = others.find((m) => m.id !== module.id && m.settings.anchor === anchor);
	const anchorError = !anchor
		? null
		: !anchorPattern.test(anchor)
			? "Use lowercase letters, numbers and dashes, starting with a letter or number"
			: taken
				? `“${nameOf(taken)}” already uses this link name`
				: null;
	const dateError = s.showFrom && s.showUntil && dayjs(s.showFrom).isAfter(dayjs(s.showUntil)) ? "Ends before it starts" : null;
	const quick = focus === "name";

	const save = () => {
		if (anchorError || dateError) return;
		onSave({ name: name.trim() || undefined, settings: { ...s, anchor: anchor || undefined, note: s.note?.trim() || undefined } });
	};

	return (
		<Modal
			opened={!!current}
			onClose={onClose}
			radius="lg"
			size={quick ? "sm" : "lg"}
			title={<Text fw={600}>{quick ? "Rename module" : `Section settings · ${module.name || def?.name}`}</Text>}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					save();
				}}
			>
				<Stack>
					<TextInput
						label="Name in the admin"
						description="Only shown on this page's tabs"
						placeholder={def?.name}
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
						maxLength={60}
						data-autofocus={quick || undefined}
					/>
					{!quick && (
						<>
							<TextInput
								label="Link name"
								description={
									anchor && !anchorError
										? `Links to ${pagePath === "/" ? "" : pagePath}/#${anchor} scroll here`
										: "Lets menus and buttons link straight to this section, e.g. /#services"
								}
								leftSection={<IconHash size={14} />}
								placeholder="e.g. services"
								value={s.anchor ?? ""}
								error={anchorError}
								onChange={(e) => setS({ ...s, anchor: e.currentTarget.value.toLowerCase().replace(/\s+/g, "-") })}
								rightSectionWidth={110}
								rightSection={
									<Button
										size="compact-xs"
										variant="subtle"
										color="gray"
										leftSection={<IconWand size={12} />}
										onClick={() => setS({ ...s, anchor: slugify(name || def?.name || module.type) })}
									>
										From name
									</Button>
								}
							/>
							{def?.toneable && (
								<div>
									<Text size="sm" fw={500}>
										Background
									</Text>
									<Text size="xs" c="dimmed" mb={6}>
										“Automatic” keeps the module's own look
									</Text>
									<SegmentedControl
										radius="xl"
										value={s.tone ?? "auto"}
										onChange={(tone) => setS({ ...s, tone: tone as ModuleSettings["tone"] })}
										data={[
											{ value: "auto", label: "Automatic" },
											{ value: "plain", label: "White" },
											{ value: "muted", label: "Soft grey" },
											{ value: "navy", label: "Navy" },
										]}
									/>
								</div>
							)}
							<div>
								<Text size="sm" fw={500} mb={6}>
									Show on
								</Text>
								<SegmentedControl
									radius="xl"
									value={s.visibleOn ?? "all"}
									onChange={(visibleOn) => setS({ ...s, visibleOn: visibleOn as ModuleSettings["visibleOn"] })}
									data={[
										{ value: "all", label: "All screens" },
										{ value: "desktop", label: "Desktop only" },
										{ value: "mobile", label: "Phones and tablets" },
									]}
								/>
							</div>
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<DateInput
									label="Show from"
									description="Empty: straight away"
									placeholder="Pick a date"
									clearable
									valueFormat="D MMM YYYY"
									value={toDay(s.showFrom)}
									onChange={(d) => setS({ ...s, showFrom: d ? dayjs(d).startOf("day").toISOString() : null })}
								/>
								<DateInput
									label="Show until"
									description="Empty: no end; inclusive"
									placeholder="Pick a date"
									clearable
									valueFormat="D MMM YYYY"
									value={toDay(s.showUntil)}
									error={dateError}
									onChange={(d) => setS({ ...s, showUntil: d ? dayjs(d).endOf("day").toISOString() : null })}
								/>
							</SimpleGrid>
							<Textarea
								label="Note for editors"
								description="Never shown on the site, e.g. “Swap the photo after the summit”"
								autosize
								minRows={2}
								maxLength={500}
								value={s.note ?? ""}
								onChange={(e) => setS({ ...s, note: e.currentTarget.value })}
							/>
						</>
					)}
					<Group justify="flex-end">
						<Button variant="default" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={!!anchorError || !!dateError}>
							Apply
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
