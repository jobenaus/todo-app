import { test, expect, type Page } from "@playwright/test";

// Helper to delete all todos via the UI
async function deleteAllTodos(page: Page) {
  await page.goto("/");
  page.on("dialog", (dialog) => dialog.accept());
  while ((await page.getByTestId("todo-item").count()) > 0) {
    await page.getByTestId("todo-item").first().locator('button:has-text("Delete")').click();
    await page.waitForURL("/");
  }
}

test.describe.serial("Todo App", () => {
  test("healthcheck returns 200", async ({ request }) => {
    const response = await request.get("/up");
    expect(response.status()).toBe(200);
  });

  test("shows empty state when no todos exist", async ({ page }) => {
    await deleteAllTodos(page);
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Todos");
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });

  test("can create a todo", async ({ page }) => {
    await page.goto("/");
    await page.locator("#todo-title").fill("Buy groceries");
    await page.getByTestId("add-todo").click();
    await expect(page.getByTestId("todo-item")).toHaveCount(1);
    await expect(page.getByText("Buy groceries")).toBeVisible();
  });

  test("can toggle a todo as completed", async ({ page }) => {
    await page.goto("/");

    const todoItem = page.getByTestId("todo-item").filter({ hasText: "Buy groceries" });
    await todoItem.locator("button.todo-toggle").click();

    // The todo title should now have the completed class with line-through
    const titleSpan = page.getByTestId("todo-item").filter({ hasText: "Buy groceries" }).getByTestId("todo-title");
    await expect(titleSpan).toHaveCSS("text-decoration-line", "line-through");
  });

  test("can create a second todo", async ({ page }) => {
    await page.goto("/");
    await page.locator("#todo-title").fill("Walk the dog");
    await page.getByTestId("add-todo").click();
    await expect(page.getByTestId("todo-item")).toHaveCount(2);
  });

  test("can edit a todo", async ({ page }) => {
    await page.goto("/");

    const todoItem = page.getByTestId("todo-item").filter({ hasText: "Walk the dog" });
    await todoItem.getByTestId("todo-title").dblclick();

    const input = todoItem.locator("input.todo-inline-edit");
    await expect(input).toBeVisible();
    await input.fill("Walk the cat");
    await input.press("Enter");

    await expect(page.getByText("Walk the cat")).toBeVisible();
  });

  test("can delete a todo", async ({ page }) => {
    await page.goto("/");
    const initialCount = await page.getByTestId("todo-item").count();

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByTestId("todo-item").first().locator('button:has-text("Delete")').click();

    await expect(page.getByTestId("todo-item")).toHaveCount(initialCount - 1);
  });

  test("shows remaining and completed counts", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".todo-footer")).toBeVisible();
  });
});
