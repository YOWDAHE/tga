"use client";

import {
	Modal,
	Text,
	Group,
	Button,
	Stack,
	Alert,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface DeleteConfirmationModalProps {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	loading?: boolean;
	itemName?: string;
	itemType?: string;
}

const DeleteConfirmationModal = ({
	opened,
	onClose,
	onConfirm,
	title = "Confirm Deletion",
	message,
	confirmText = "Delete",
	cancelText = "Cancel",
	loading = false,
	itemName,
	itemType = "item",
}: DeleteConfirmationModalProps) => {
	const defaultMessage = itemName
		? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
		: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={title}
			centered
			size="sm"
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
		>
			<Stack gap="md">
				<Alert
					icon={<IconAlertTriangle size={16} />}
					title="Warning"
					color="red"
					variant="light"
				>
					<Text size="sm">
						{message || defaultMessage}
					</Text>
				</Alert>

				<Group justify="flex-end" gap="sm">
					<Button
						variant="light"
						onClick={onClose}
						disabled={loading}
					>
						{cancelText}
					</Button>
					<Button
						color="red"
						onClick={onConfirm}
						loading={loading}
					>
						{confirmText}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};

export default DeleteConfirmationModal; 