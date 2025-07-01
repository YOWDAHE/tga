"use client"

import { useState } from "react"
import { Title, Button, TextInput, Paper, Text, Stack, Group, ActionIcon, Modal, SimpleGrid, Card } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconEdit, IconTrash, IconPhone, IconMail, IconBrandWhatsapp } from "@tabler/icons-react"

interface ContactInfo {
  id: number
  medium: string
  email?: string
  phone_number?: string
  createdAt: Date
  updatedAt: Date
}

const mockContactInfo: ContactInfo[] = [
  {
    id: 1,
    medium: "Email",
    email: "contact@company.com",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    medium: "Phone",
    phone_number: "+1 234 567 8900",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    medium: "WhatsApp",
    phone_number: "+1 234 567 8901",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

export default function ContactManagement() {
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>(mockContactInfo)
  const [contactModalOpened, { open: openContactModal, close: closeContactModal }] = useDisclosure(false)
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null)

  const contactForm = useForm({
    initialValues: {
      medium: "",
      email: "",
      phone_number: "",
    },
    validate: {
      medium: (value) => (value.trim() ? null : "Medium is required"),
      email: (value, values) => {
        if (values.medium.toLowerCase().includes("email") && !value.trim()) {
          return "Email is required for email medium"
        }
        if (value && !/^\S+@\S+$/.test(value)) {
          return "Invalid email format"
        }
        return null
      },
      phone_number: (value, values) => {
        if (
          (values.medium.toLowerCase().includes("phone") || values.medium.toLowerCase().includes("whatsapp")) &&
          !value.trim()
        ) {
          return "Phone number is required for phone/WhatsApp medium"
        }
        return null
      },
    },
  })

  const handleSubmitContact = (values: typeof contactForm.values) => {
    if (editingContact) {
      setContactInfo((prev) =>
        prev.map((item) =>
          item.id === editingContact.id
            ? {
                ...item,
                ...values,
                updatedAt: new Date(),
              }
            : item,
        ),
      )
      notifications.show({
        title: "Success",
        message: "Contact info updated successfully",
        color: "green",
      })
    } else {
      const newContact: ContactInfo = {
        id: Date.now(),
        ...values,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setContactInfo((prev) => [...prev, newContact])
      notifications.show({
        title: "Success",
        message: "Contact info added successfully",
        color: "green",
      })
    }
    handleCloseContactModal()
  }

  const handleEditContact = (contact: ContactInfo) => {
    setEditingContact(contact)
    contactForm.setValues({
      medium: contact.medium,
      email: contact.email || "",
      phone_number: contact.phone_number || "",
    })
    openContactModal()
  }

  const handleDeleteContact = (id: number) => {
    setContactInfo((prev) => prev.filter((item) => item.id !== id))
    notifications.show({
      title: "Success",
      message: "Contact info deleted successfully",
      color: "red",
    })
  }

  const handleCloseContactModal = () => {
    closeContactModal()
    setEditingContact(null)
    contactForm.reset()
  }

  const handleCreateContact = () => {
    setEditingContact(null)
    contactForm.reset()
    openContactModal()
  }

  const getContactIcon = (medium: string) => {
    const mediumLower = medium.toLowerCase()
    if (mediumLower.includes("email")) return <IconMail size={20} />
    if (mediumLower.includes("whatsapp")) return <IconBrandWhatsapp size={20} />
    if (mediumLower.includes("phone")) return <IconPhone size={20} />
    return <IconPhone size={20} />
  }

  return (
			<div style={{ padding: "24px" }}>
				<Group justify="space-between" mb="lg">
					<div>
						<Title order={2}>Contact Information Management</Title>
						<Text c="gray.6" size="sm" mt="xs">
							Manage contact methods for your website
						</Text>
					</div>
				</Group>

				<SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md" mb="xl">
					{contactInfo.map((contact) => (
						<Card key={contact.id} withBorder padding="lg" radius="md">
							<Group justify="space-between" mb="md">
								<Group>
									{getContactIcon(contact.medium)}
									<Text fw={500}>{contact.medium}</Text>
								</Group>
								<Group gap="xs">
									<ActionIcon
										variant="light"
										color="orange"
										onClick={() => handleEditContact(contact)}
									>
										<IconEdit size={16} />
									</ActionIcon>
									<ActionIcon
										variant="light"
										color="red"
										onClick={() => handleDeleteContact(contact.id)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Group>
							</Group>

							<Stack gap="xs">
								{contact.email && (
									<Text size="sm" c="dimmed">
										📧 {contact.email}
									</Text>
								)}
								{contact.phone_number && (
									<Text size="sm" c="dimmed">
										📞 {contact.phone_number}
									</Text>
								)}
							</Stack>

							<Text size="xs" c="dimmed" mt="md">
								Added: {contact.createdAt.toLocaleDateString()}
							</Text>
						</Card>
					))}
				</SimpleGrid>

				{/* Add Button */}
				<Paper withBorder p="lg" radius="md" style={{ textAlign: "center" }}>
					<Button
						leftSection={<IconPlus size={16} />}
						variant="light"
						size="lg"
						onClick={handleCreateContact}
						style={{ width: "100%" }}
					>
						Add New Contact Method
					</Button>
				</Paper>

				{/* Contact Modal */}
				<Modal
					opened={contactModalOpened}
					onClose={handleCloseContactModal}
					title={editingContact ? "Edit Contact Info" : "Add Contact Info"}
					size="md"
				>
					<form onSubmit={contactForm.onSubmit(handleSubmitContact)}>
						<Stack>
							<TextInput
								label="Medium"
								placeholder="e.g., Email, Phone, WhatsApp, Telegram"
								required
								{...contactForm.getInputProps("medium")}
							/>

							<TextInput
								label="Email Address"
								placeholder="Enter email address"
								{...contactForm.getInputProps("email")}
							/>

							<TextInput
								label="Phone Number"
								placeholder="Enter phone number with country code"
								{...contactForm.getInputProps("phone_number")}
							/>

							<Text size="xs" c="dimmed">
								Note: Fill in the appropriate field based on the medium type. For email
								mediums, provide an email address. For phone/WhatsApp mediums, provide a
								phone number.
							</Text>

							<Group justify="flex-end">
								<Button variant="light" onClick={handleCloseContactModal}>
									Cancel
								</Button>
								<Button type="submit">{editingContact ? "Update" : "Add"}</Button>
							</Group>
						</Stack>
					</form>
				</Modal>
			</div>
		);
}
