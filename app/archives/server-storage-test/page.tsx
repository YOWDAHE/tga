"use client";

import { useState } from "react";
import { Button, Paper, Text, Stack, Group, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconUpload, IconDownload, IconTestPipe, IconEdit, IconTrash, IconPlus, IconSearch } from "@tabler/icons-react";

export default function ServerStorageTestPage() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testServerStorage = async () => {
    setLoading(true);
    try {
      // Test the migration endpoint
      const response = await fetch('/api/archives/migrate-cloudinary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResults(result);
        notifications.show({
          title: "Migration Test Successful",
          message: `Migrated ${result.data.migrated} documents, skipped ${result.data.skipped}`,
          color: "green",
        });
      } else {
        throw new Error(result.error || 'Migration failed');
      }
    } catch (error: any) {
      notifications.show({
        title: "Migration Test Failed",
        message: error.message || "An error occurred during migration test",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testDocumentUpload = async () => {
    setLoading(true);
    try {
      // Create a simple test PDF (this is just a placeholder)
      const testPdfContent = "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF";
      
      const blob = new Blob([testPdfContent], { type: 'application/pdf' });
      const file = new File([blob], 'test-document.pdf', { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', 'Test Document - Server Storage');
      formData.append('category_id', '1'); // Assuming category 1 exists
      formData.append('author', 'Test Author');
      formData.append('description', 'This is a test document for server storage');

      const response = await fetch('/api/archives/add', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        notifications.show({
          title: "Upload Test Successful",
          message: "Test document uploaded successfully to server storage",
          color: "green",
        });
        setTestResults((prev: any) => ({ ...prev, uploadTest: result }));
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      notifications.show({
        title: "Upload Test Failed",
        message: error.message || "An error occurred during upload test",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testDocumentUpdate = async () => {
    setLoading(true);
    try {
      // First, let's get a list of documents to test with
      const documentsResponse = await fetch('/api/archives');
      const documentsResult = await documentsResponse.json();
      
      if (!documentsResult.success || !documentsResult.data?.documents?.length) {
        notifications.show({
          title: "No Documents Found",
          message: "Please upload a document first to test updates",
          color: "orange",
        });
        return;
      }

      const firstDocument = documentsResult.data.documents[0];
      
      // Test updating the first document
      const updateData = {
        id: firstDocument.id,
        title: `Updated: ${firstDocument.title}`,
        category_id: firstDocument.category_id,
        author: "Test Updater",
        description: "This document was updated via the test function"
      };

      const response = await fetch(`/api/archives/${firstDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (response.ok) {
        notifications.show({
          title: "Update Test Successful",
          message: `Document "${firstDocument.title}" updated successfully`,
          color: "green",
        });
        setTestResults((prev: any) => ({ ...prev, updateTest: result }));
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error: any) {
      notifications.show({
        title: "Update Test Failed",
        message: error.message || "An error occurred during update test",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testCategoryDelete = async () => {
    setLoading(true);
    try {
      // First, let's get a list of categories to test with
      const categoriesResponse = await fetch('/api/category');
      const categoriesResult = await categoriesResponse.json();
      
      if (!categoriesResult.success || !categoriesResult.data?.length) {
        notifications.show({
          title: "No Categories Found",
          message: "Please create a category first to test deletion",
          color: "orange",
        });
        return;
      }

      // Find a category that's not being used by documents
      const categories = categoriesResult.data;
      let categoryToDelete = null;
      
      for (const category of categories) {
        // Check if this category is being used by documents
        const documentsResponse = await fetch('/api/archives');
        const documentsResult = await documentsResponse.json();
        
        if (documentsResult.success && documentsResult.data?.documents) {
          const documentsUsingCategory = documentsResult.data.documents.filter(
            (doc: any) => doc.category_id === category.id
          );
          
          if (documentsUsingCategory.length === 0) {
            categoryToDelete = category;
            break;
          }
        }
      }

      if (!categoryToDelete) {
        notifications.show({
          title: "No Safe Category to Delete",
          message: "All categories are being used by documents. Cannot test deletion.",
          color: "orange",
        });
        return;
      }

      // Test deleting the category
      const response = await fetch(`/api/category/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok) {
        notifications.show({
          title: "Category Delete Test Successful",
          message: `Category "${categoryToDelete.name}" deleted successfully`,
          color: "green",
        });
        setTestResults((prev: any) => ({ ...prev, categoryDeleteTest: result }));
      } else {
        throw new Error(result.error || 'Category delete failed');
      }
    } catch (error: any) {
      notifications.show({
        title: "Category Delete Test Failed",
        message: error.message || "An error occurred during category delete test",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testCategoryCreate = async () => {
    setLoading(true);
    try {
      // Test creating a new category
      const categoryData = {
        name: `Test Category ${Date.now()}`,
        description: "This is a test category created via the test function"
      };

      const response = await fetch('/api/category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      const result = await response.json();
      
      if (response.ok) {
        notifications.show({
          title: "Category Create Test Successful",
          message: `Category "${categoryData.name}" created successfully`,
          color: "green",
        });
        setTestResults((prev: any) => ({ ...prev, categoryCreateTest: result }));
      } else {
        throw new Error(result.error || 'Category create failed');
      }
    } catch (error: any) {
      notifications.show({
        title: "Category Create Test Failed",
        message: error.message || "An error occurred during category create test",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testCategoryPagination = async () => {
    setLoading(true);
    try {
      // Test pagination with different parameters
      const testCases = [
        { page: 1, limit: 5, search: '' },
        { page: 2, limit: 5, search: '' },
        { page: 1, limit: 10, search: 'test' },
      ];

      const results: any[] = [];

      for (const testCase of testCases) {
        const queryParams = new URLSearchParams();
        if (testCase.page) queryParams.append('page', testCase.page.toString());
        if (testCase.limit) queryParams.append('limit', testCase.limit.toString());
        if (testCase.search) queryParams.append('search', testCase.search);

        const response = await fetch(`/api/category?${queryParams.toString()}`);
        const result = await response.json();
        
        results.push({
          testCase,
          success: response.ok,
          data: result
        });
      }

      const allSuccessful = results.every(r => r.success);
      
      if (allSuccessful) {
        notifications.show({
          title: "Category Pagination Test Successful",
          message: `All pagination tests passed. Tested ${results.length} scenarios.`,
          color: "green",
        });
        setTestResults((prev: any) => ({ ...prev, categoryPaginationTest: results }));
      } else {
        throw new Error('Some pagination tests failed');
      }
    } catch (error: any) {
      notifications.show({
        title: "Category Pagination Test Failed",
        message: error.message || "An error occurred during pagination test",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testNewsCategory = async () => {
    setLoading(true);
    try {
      // First, let's get a list of categories to test with
      const categoriesResponse = await fetch('/api/category');
      const categoriesResult = await categoriesResponse.json();
      
      if (!categoriesResult.success || !categoriesResult.data?.length) {
        notifications.show({
          title: "No Categories Found",
          message: "Please create a category first to test news creation",
          color: "orange",
        });
        return;
      }

      const category = categoriesResult.data[0];
      
      // Test creating news with category
      const newsData = {
        title: "Test News with Category",
        content: "This is a test news article with category functionality.",
        category_id: category.id,
        hashtags: "test,category,news",
        featured: false,
        read_minutes: 2,
        source: "Website",
        created_by: "test-user"
      };

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsData),
      });

      const result = await response.json();

      if (result.success) {
        notifications.show({
          title: "News Created Successfully",
          message: `News "${result.data.title}" created with category "${category.name}"`,
          color: "green",
        });

        // Test fetching the news to verify category is included
        const fetchResponse = await fetch(`/api/news/${result.data.id}`);
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success && fetchResult.data.category) {
          notifications.show({
            title: "Category Verification",
            message: `News fetched successfully with category: ${fetchResult.data.category.name}`,
            color: "green",
          });
        } else {
          notifications.show({
            title: "Category Verification Failed",
            message: "News was created but category information is missing",
            color: "orange",
          });
        }
      } else {
        notifications.show({
          title: "News Creation Failed",
          message: result.error || "Failed to create news with category",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error testing news category:", error);
      notifications.show({
        title: "Test Failed",
        message: "An error occurred while testing news category functionality",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Paper withBorder p="xl" radius="md">
        <Stack gap="lg">
          <Group>
            <IconTestPipe size={24} color="blue" />
            <Text size="xl" fw={700}>Server Storage Test</Text>
          </Group>

          <Alert color="blue" variant="light">
            <Text size="sm">
              This page tests the new server storage functionality for archives. 
              The system now stores documents on the server instead of Cloudinary, 
              similar to how partner images are handled in the landing page.
            </Text>
          </Alert>

          <Stack gap="md">
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={testDocumentUpload}
              loading={loading}
              variant="light"
            >
              Test Document Upload (Server Storage)
            </Button>

            <Button
              leftSection={<IconDownload size={16} />}
              onClick={testServerStorage}
              loading={loading}
              variant="light"
              color="orange"
            >
              Test Migration (Cloudinary to Server)
            </Button>

            <Button
              leftSection={<IconEdit size={16} />}
              onClick={testDocumentUpdate}
              loading={loading}
              variant="light"
              color="green"
            >
              Test Document Update
            </Button>

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={testCategoryCreate}
              loading={loading}
              variant="light"
              color="blue"
            >
              Test Category Create
            </Button>

            <Button
              leftSection={<IconTrash size={16} />}
              onClick={testCategoryDelete}
              loading={loading}
              variant="light"
              color="red"
            >
              Test Category Delete
            </Button>

            <Button
              leftSection={<IconSearch size={16} />}
              onClick={testCategoryPagination}
              loading={loading}
              variant="light"
              color="purple"
            >
              Test Category Pagination
            </Button>

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={testNewsCategory}
              loading={loading}
              variant="light"
              color="teal"
            >
              Test News Category
            </Button>
          </Stack>

          {testResults && (
            <Paper withBorder p="md" bg="gray.0">
              <Text fw={500} mb="md">Test Results:</Text>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </Paper>
          )}

          <Alert color="green" variant="light">
            <Text size="sm">
              <strong>What's Changed:</strong>
              <br />
              • Documents are now stored in <code>backend/uploads/documents/</code>
              <br />
              • Files are served via <code>/uploads/documents/filename</code>
              <br />
              • No more Cloudinary dependency for archives
              <br />
              • Better performance and cost savings
            </Text>
          </Alert>
        </Stack>
      </Paper>
    </div>
  );
} 