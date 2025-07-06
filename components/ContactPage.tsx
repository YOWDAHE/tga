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
    Container,
    Alert,
    Group,
    Card,
    Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle, IconMail, IconPhone, IconMessage } from "@tabler/icons-react";
import { createRemark } from "@/app/actions/remarks.actions";

interface ContactInfo {
    id: number;
    medium: string;
    email?: string;
    phone_number?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ContactPageProps {
    initialContactInfo?: ContactInfo[];
}

export default function ContactPage({ initialContactInfo = [] }: ContactPageProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            name: "",
            email: "",
            content: "",
        },
        validate: {
            name: (value) => (!value ? "Name is required" : null),
            email: (value) => (!value ? "Email is required" : !/^\S+@\S+$/.test(value) ? "Invalid email" : null),
            content: (value) => (!value ? "Message is required" : value.length < 10 ? "Message must be at least 10 characters" : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setIsSubmitting(true);
        try {
            const result = await createRemark(values);
            if (result.success) {
                notifications.show({
                    title: "Success",
                    message: "Your message has been sent successfully. We'll get back to you soon!",
                    color: "green",
                });
                form.reset();
            } else {
                notifications.show({
                    title: "Error",
                    message: result.error || "Failed to send message",
                    color: "red",
                });
            }
        } catch (error: any) {
            notifications.show({
                title: "Error",
                message: error.message || "An unexpected error occurred",
                color: "red",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getContactIcon = (medium: string) => {
        switch (medium.toLowerCase()) {
            case 'email':
                return <IconMail size={20} />;
            case 'phone':
                return <IconPhone size={20} />;
            default:
                return <IconMessage size={20} />;
        }
    };

    return (
        <Container size="lg" py="xl">
            <Title order={1} ta="center" mb="xl">
                Contact Us
            </Title>

            <Alert
                icon={<IconInfoCircle size={16} />}
                title="Get in Touch"
                color="blue"
                mb="lg"
            >
                Have a question, suggestion, or feedback? We'd love to hear from you! 
                Fill out the form below and we'll get back to you as soon as possible.
            </Alert>

            {/* Contact Information */}
            {initialContactInfo.length > 0 && (
                <Paper withBorder p="xl" radius="md" mb="xl">
                    <Title order={3} mb="md">
                        Contact Information
                    </Title>
                    <Group gap="md">
                        {initialContactInfo.map((contact) => (
                            <Card key={contact.id} withBorder p="md" style={{ flex: 1, minWidth: 200 }}>
                                <Group gap="sm" mb="xs">
                                    {getContactIcon(contact.medium)}
                                    <Badge variant="light" color="blue">
                                        {contact.medium}
                                    </Badge>
                                </Group>
                                {contact.email && (
                                    <Text size="sm" mb="xs">
                                        <strong>Email:</strong> {contact.email}
                                    </Text>
                                )}
                                {contact.phone_number && (
                                    <Text size="sm">
                                        <strong>Phone:</strong> {contact.phone_number}
                                    </Text>
                                )}
                            </Card>
                        ))}
                    </Group>
                </Paper>
            )}

            {/* Contact Form */}
            <Paper withBorder p="xl" radius="md">
                <Title order={3} mb="lg">
                    Send us a Message
                </Title>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <TextInput
                            label="Name"
                            placeholder="Enter your full name"
                            required
                            {...form.getInputProps("name")}
                        />

                        <TextInput
                            label="Email"
                            placeholder="Enter your email address"
                            type="email"
                            required
                            {...form.getInputProps("email")}
                        />

                        <Textarea
                            label="Message"
                            placeholder="Tell us what's on your mind..."
                            minRows={6}
                            required
                            {...form.getInputProps("content")}
                        />

                        <Button
                            type="submit"
                            size="lg"
                            loading={isSubmitting}
                            fullWidth
                        >
                            Send Message
                        </Button>
                    </Stack>
                </form>
            </Paper>

            <Paper withBorder p="md" mt="lg" bg="gray.0">
                <Text size="sm" c="dimmed">
                    <strong>Note:</strong> Your message will be reviewed by our team and we'll respond to you via email. 
                    Please allow 24-48 hours for a response during business days.
                </Text>
            </Paper>
        </Container>
    );
} 