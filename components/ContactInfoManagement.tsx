"use client";

import { useState } from "react";
import {
    Title,
    Button,
    TextInput,
    Paper,
    Text,
    Stack,
    Group,
    Modal,
    Table,
    ActionIcon,
    Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
    IconEdit,
    IconTrash,
    IconPlus,
    IconMail,
    IconPhone,
    IconMessage,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
    createContactInfo,
    updateContactInfo,
    deleteContactInfo,
} from "@/app/actions/contact.actions";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface ContactInfo {
    id: number;
    medium: string;
    email?: string;
    phone_number?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ContactInfoManagementProps {
    initialContactInfo?: ContactInfo[];
}

export default function ContactInfoManagement({
    initialContactInfo = [],
}: ContactInfoManagementProps) {
    const router = useRouter();
    const [contactInfo, setContactInfo] = useState<ContactInfo[]>(initialContactInfo);
    const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);
    const [contactModalOpened, { open: openContactModal, close: closeContactModal }] = useDisclosure(false);
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

    const contactForm = useForm({
        initialValues: {
            medium: "",
            email: "",
            phone_number: "",
        },
        validate: {
            medium: (value) => (!value ? "Medium is required" : null),
        },
    });

    const handleContactSubmit = async (values: typeof contactForm.values) => {
        try {
            let result;
            if (editingContact) {
                result = await updateContactInfo(editingContact.id, values);
            } else {
                result = await createContactInfo(values);
            }

            if (result.success) {
                if (editingContact) {
                    setContactInfo((prev) =>
                        prev.map((item) =>
                            item.id === editingContact.id ? { ...item, ...values } : item
                        )
                    );
                } else {
                    setContactInfo((prev) => [...prev, { id: Date.now(), ...values }]);
                }
                notifications.show({
                    title: "Success",
                    message: editingContact ? "Contact info updated successfully" : "Contact info added successfully",
                    color: "green",
                });
                router.refresh();
            } else {
                notifications.show({
                    title: "Error",
                    message: result.error || "Failed to save contact info",
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
        closeContactModal();
        setEditingContact(null);
        contactForm.reset();
    };

    const handleDelete = async (id: number) => {
        try {
            const result = await deleteContactInfo(id);
            if (result.success) {
                setContactInfo((prev) => prev.filter((item) => item.id !== id));
                notifications.show({
                    title: "Success",
                    message: "Contact info deleted successfully",
                    color: "red",
                });
                closeDeleteModal();
                setEditingContact(null);
            } else {
                notifications.show({
                    title: "Error",
                    message: result.error || "Failed to delete contact info",
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

    const handleEditContact = (contact: ContactInfo) => {
        setEditingContact(contact);
        contactForm.setValues({
            medium: contact.medium,
            email: contact.email || "",
            phone_number: contact.phone_number || "",
        });
        openContactModal();
    };

    const handleAddContact = () => {
        setEditingContact(null);
        contactForm.reset();
        openContactModal();
    };

    const handleDeleteContact = (contact: ContactInfo) => {
        setEditingContact(contact);
        openDeleteModal();
    };

    const getContactIcon = (medium: string) => {
        switch (medium.toLowerCase()) {
            case 'email':
                return <IconMail size={16} />;
            case 'phone':
                return <IconPhone size={16} />;
            default:
                return <IconMessage size={16} />;
        }
    };

    const rows = contactInfo.map((contact) => (
        <Table.Tr key={contact.id}>
            <Table.Td>
                <Group gap="sm">
                    {getContactIcon(contact.medium)}
                    <Text size="sm" fw={500}>
                        {contact.medium}
                    </Text>
                </Group>
            </Table.Td>
            <Table.Td>
                <Text size="sm">
                    {contact.email || "N/A"}
                </Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">
                    {contact.phone_number || "N/A"}
                </Text>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEditContact(contact)}
                    >
                        <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteContact(contact)}
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div style={{ padding: "24px" }}>
            <Group justify="space-between" mb="lg">
                <Title order={2}>
                    Contact Information Management
                </Title>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddContact}
                >
                    Add Contact Info
                </Button>
            </Group>

            <Paper withBorder p="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Medium</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Phone Number</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.length > 0 ? (
                            rows
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={4}>
                                    <Text ta="center" c="dimmed" py="xl">
                                        No contact information found
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

            {/* Contact Modal */}
            <Modal
                opened={contactModalOpened}
                onClose={closeContactModal}
                title={editingContact ? "Edit Contact Info" : "Add Contact Info"}
                size="md"
            >
                <form onSubmit={contactForm.onSubmit(handleContactSubmit)}>
                    <Stack>
                        <TextInput
                            label="Medium"
                            placeholder="e.g., Email, Phone, WhatsApp"
                            required
                            {...contactForm.getInputProps("medium")}
                        />
                        <TextInput
                            label="Email"
                            placeholder="Enter email address"
                            type="email"
                            {...contactForm.getInputProps("email")}
                        />
                        <TextInput
                            label="Phone Number"
                            placeholder="Enter phone number"
                            {...contactForm.getInputProps("phone_number")}
                        />
                        <Group justify="flex-end">
                            <Button variant="outline" onClick={closeContactModal}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingContact ? "Update" : "Add"}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                opened={deleteModalOpened}
                onClose={closeDeleteModal}
                onConfirm={() => editingContact && handleDelete(editingContact.id)}
                title="Delete Contact Info"
                message={`Are you sure you want to delete the ${editingContact?.medium} contact information? This action cannot be undone.`}
            />
        </div>
    );
} 