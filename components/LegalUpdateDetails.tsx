"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { LegalUpdate } from "@/types/legal-updates";
import { StatusBadge, formatDate } from "./admin-ui";
import { Chips, EditorFrame, Facts, SideCard, Workspace, editorClasses as classes, splitList, textStats } from "./editor";

const CONTENT_TYPE_LABELS: Record<string, string> = {
	alert: "Client Alert",
	analysis: "Analysis",
	guide: "Guide",
	update: "Legal Update",
};

interface LegalUpdateDetailsProps {
	legalUpdate: LegalUpdate;
}

export default function LegalUpdateDetails({ legalUpdate: item }: LegalUpdateDetailsProps) {
	const type = CONTENT_TYPE_LABELS[item.content_type] || item.content_type;
	const keywords = splitList(item.seo_keywords);
	const { minutes } = textStats(item.content);

	return (
		<EditorFrame
			back={{ href: "/legal-updates", label: "Legal updates" }}
			actions={
				<Button component={Link} href={`/legal-updates/add?edit=${item.id}`} leftSection={<IconEdit size={16} />}>
					Edit
				</Button>
			}
		>
			<Workspace
				main={
					<article className={classes.article}>
						<div className={classes.articleInner}>
							<div className={classes.eyebrow}>
								{type}
								{item.category ? ` · ${item.category.name}` : ""}
							</div>
							<h1 className={classes.articleTitle}>{item.title}</h1>
							<div className={classes.articleMeta}>
								{item.author && <span>{item.author}</span>}
								<span>{item.published ? formatDate(item.published_date) : "Not published"}</span>
								{minutes > 0 && <span>{minutes} min read</span>}
							</div>
							{item.summary && <p className={classes.articleSummary}>{item.summary}</p>}
							<div className={classes.articleRule} />
							{item.content ?
								<div
									className={`rich-text-content ${classes.articleBody}`}
									dangerouslySetInnerHTML={{ __html: item.content }}
								/>
							:	<p className={classes.empty}>No content yet.</p>}
						</div>
					</article>
				}
				aside={
					<>
						<SideCard title="Status">
							<Facts
								items={[
									{
										label: "Status",
										value: (
											<StatusBadge tone={item.published ? "good" : undefined}>
												{item.published ? "Published" : "Draft"}
											</StatusBadge>
										),
									},
									item.published && { label: "Published", value: formatDate(item.published_date) },
									{ label: "Featured", value: item.featured ? "Yes" : "No" },
									{ label: "Views", value: (item.view_count ?? 0).toLocaleString() },
									{ label: "Created", value: formatDate(item.createdAt) },
									{ label: "Last edited", value: formatDate(item.updatedAt) },
								]}
							/>
						</SideCard>

						<SideCard title="Details">
							<Facts
								items={[
									{ label: "Type", value: type },
									{ label: "Practice area", value: item.category?.name ?? "—" },
									{ label: "Author", value: item.author || "—" },
									{ label: "URL", value: `/legal-updates/${item.slug}` },
									{
										label: "Subscriber email",
										value: item.notify_subscribers ? "On publish" : "Off",
									},
								]}
							/>
						</SideCard>

						<SideCard title="Search engines">
							<p className={classes.prose}>{item.meta_description || "No meta description."}</p>
							{keywords.length > 0 && (
								<div style={{ marginTop: 12 }}>
									<Chips items={keywords} />
								</div>
							)}
						</SideCard>
					</>
				}
			/>
		</EditorFrame>
	);
}
