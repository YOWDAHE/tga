"use client";

import { useState } from "react";
import {
	Title,
	Button,
	TextInput,
	Textarea,
	Paper,
	Text,
	Stack,
	Group,
	Modal,
	Table,
	ActionIcon,
	Badge,
	ScrollArea,
	Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconTrash, IconMail, IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { deleteRemark, replyToRemark } from "@/app/actions/remarks.actions";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface Remark {
	id: number;
	name: string;
	email: string;
	content: string;
	response?: string;
	createdAt: string;
	updatedAt: string;
}

interface RemarksManagementProps {
	initialRemarks?: Remark[];
}

export default function RemarksManagement({
	initialRemarks = [],
}: RemarksManagementProps) {
	const router = useRouter();
	const [remarks, setRemarks] = useState<Remark[]>(initialRemarks);
	const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null);
	const [replyModalOpened, { open: openReplyModal, close: closeReplyModal }] =
		useDisclosure(false);
	const [viewModalOpened, { open: openViewModal, close: closeViewModal }] =
		useDisclosure(false);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
		useDisclosure(false);

	const replyForm = useForm({
		initialValues: {
			subject: "",
			response: "",
		},
		validate: {
			subject: (value) => (!value ? "Subject is required" : null),
			response: (value) => (!value ? "Message is required" : null),
		},
	});

	const handleReply = async (values: typeof replyForm.values) => {
		if (!selectedRemark) return;

		try {
			console.log(values);
			const result = await replyToRemark(selectedRemark.id, values);
			if (result.success) {
			    notifications.show({
			        title: "Success",
			        message: "Reply sent successfully",
			        color: "green",
			    });
			    closeReplyModal();
			    replyForm.reset();
			    setSelectedRemark(null);
			} else {
			    notifications.show({
			        title: "Error",
			        message: result.error || "Failed to send reply",
			        color: "red",
			    });
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		}
	};

	const handleDelete = async (id: number) => {
		try {
			const result = await deleteRemark(id);
			if (result.success) {
				setRemarks((prev) => prev.filter((item) => item.id !== id));
				notifications.show({
					title: "Success",
					message: "Remark deleted successfully",
					color: "red",
				});
				closeDeleteModal();
				closeViewModal();
				setSelectedRemark(null);
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to delete remark",
					color: "red",
				});
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		}
	};

	const handleViewRemark = (remark: Remark) => {
		setSelectedRemark(remark);
		openViewModal();
	};

	const handleReplyToRemark = (remark: Remark) => {
		setSelectedRemark(remark);
		replyForm.setValues({
			subject: `Re: Your remark from TGA Law Office`,
			response: "",
		});
		openReplyModal();
	};

	const handleDeleteRemark = (remark: Remark) => {
		setSelectedRemark(remark);
		openDeleteModal();
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const rows = remarks.map((remark) => (
		<Table.Tr key={remark.id}>
			<Table.Td>
				<Text size="sm" fw={500}>
					{remark.name}
				</Text>
				<Text size="xs" c="dimmed">
					{remark.email}
				</Text>
			</Table.Td>
			<Table.Td>
				<Text size="sm" lineClamp={2}>
					{remark.content}
				</Text>
			</Table.Td>
			<Table.Td>
				<Badge color={remark.response ? "green" : "yellow"} variant="light">
					{remark.response ? "Replied" : "Pending"}
				</Badge>
			</Table.Td>
			<Table.Td>
				<Text size="sm" c="dimmed">
					{formatDate(remark.createdAt)}
				</Text>
			</Table.Td>
			<Table.Td>
				<Group gap="xs">
					<ActionIcon
						variant="subtle"
						color="blue"
						onClick={() => handleViewRemark(remark)}
					>
						<IconEye size={16} />
					</ActionIcon>
					{remark.response ? null : <ActionIcon
						variant="subtle"
						color="green"
						onClick={() => handleReplyToRemark(remark)}
					>
						<IconMail size={16} />
					</ActionIcon>}
					{/* <ActionIcon
						variant="subtle"
						color="red"
						onClick={() => handleDeleteRemark(remark)}
					>
						<IconTrash size={16} />
					</ActionIcon> */}
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<div style={{ padding: "24px" }}>
			<Title order={2} mb="lg">
				Remarks Management
			</Title>

			<Paper withBorder p="md">
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>User</Table.Th>
							<Table.Th>Content</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th>Date</Table.Th>
							<Table.Th>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{rows.length > 0 ?
							rows
						:	<Table.Tr>
								<Table.Td colSpan={5}>
									<Text ta="center" c="dimmed" py="xl">
										No remarks found
									</Text>
								</Table.Td>
							</Table.Tr>
						}
					</Table.Tbody>
				</Table>
			</Paper>

			{/* View Remark Modal */}
			<Modal
				opened={viewModalOpened}
				onClose={closeViewModal}
				title="View Remark"
				size="lg"
			>
				{selectedRemark && (
					<Stack>
						<Group>
							<Text fw={500}>Name:</Text>
							<Text>{selectedRemark.name}</Text>
						</Group>
						<Group>
							<Text fw={500}>Email:</Text>
							<Text>{selectedRemark.email}</Text>
						</Group>
						<Divider />
						<Text fw={500}>Content:</Text>
						<Paper withBorder p="md">
							<Text>{selectedRemark.content}</Text>
						</Paper>
						{selectedRemark.response && (
							<>
								<Divider />
								<Text fw={500}>Response:</Text>
								<Paper withBorder p="md" bg="gray.0">
									<Text>{selectedRemark.response}</Text>
								</Paper>
							</>
						)}
						<Group>
							<Text fw={500}>Date:</Text>
							<Text>{formatDate(selectedRemark.createdAt)}</Text>
						</Group>
						<Group justify="flex-end" mt="md">
							<Button variant="outline" onClick={closeViewModal}>
								Close
							</Button>
							<Button
								color="red"
								leftSection={<IconTrash size={16} />}
								onClick={openDeleteModal}
							>
								Delete
							</Button>
						</Group>
					</Stack>
				)}
			</Modal>

			{/* Reply Modal */}
			<Modal
				opened={replyModalOpened}
				onClose={closeReplyModal}
				title="Reply to Remark"
				size="lg"
			>
				<form onSubmit={replyForm.onSubmit(handleReply)}>
					<Stack>
						{selectedRemark && (
							<Paper withBorder p="md" bg="gray.0">
								<Text size="sm" fw={500} mb="xs">
									Original Remark:
								</Text>
								<Text size="sm">{selectedRemark.content}</Text>
							</Paper>
						)}
						<TextInput
							label="Subject"
							placeholder="Enter email subject"
							{...replyForm.getInputProps("subject")}
						/>
						<Textarea
							label="Message"
							placeholder="Enter your reply message"
							minRows={4}
							{...replyForm.getInputProps("response")}
						/>
						<Group justify="flex-end">
							<Button variant="outline" onClick={closeReplyModal}>
								Cancel
							</Button>
							<Button type="submit">Send Reply</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				onConfirm={() => selectedRemark && handleDelete(selectedRemark.id)}
				title="Delete Remark"
				message={`Are you sure you want to delete the remark from ${selectedRemark?.name}? This action cannot be undone.`}
			/>
		</div>
	);
}
