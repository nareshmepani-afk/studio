
# Build Library Document: Memory Weaver

## Component Overview

This document outlines the components of the Memory Weaver UI library, a collection of reusable UI elements built with Next.js and Tailwind CSS. The library is designed to ensure a consistent, accessible, and developer-friendly experience across the Memory Weaver application. Our design philosophy is based on creating a minimal, clean, and intuitive user interface.

## Installation & Setup

To use this component library in a new repository, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MemoryWeaver/memory-weaver-ui.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Integrate into your project:** Import components as needed from the `src/components/ui` directory.

    ```javascript
    import { Button } from "@/components/ui/button";
    ```

---

## Component Specifications

### Button

A versatile button component for user actions.

**Props Table**

| Name      | Type                                     | Default   | Description                                                                                                                             |
| :-------- | :--------------------------------------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `variant` | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` | `default`   | The visual style of the button.                                                                                                         |
| `size`    | `default`, `sm`, `lg`, `icon`            | `default` | The size of the button.                                                                                                                 |
| `asChild` | `boolean`                                | `false`   | When `true`, the button will render as a child of the component it is wrapped in, inheriting the parent's props. This is useful for wrapping a `Link` component, for example. |

**State Variations**

*   **Hover**: The button's background color will change to a slightly darker shade.
*   **Active**: The button will have a visible ring around it to indicate focus.
*   **Disabled**: The button will be semi-transparent and will not respond to user input.
*   **Loading**:  (Not implemented in the current component, but can be added with a `loading` prop that displays a spinner and disables the button).

**Accessibility (A11y)**

*   **ARIA Roles**: The component renders a standard HTML `<button>` element, which has a default `role` of `button`. No special ARIA roles are needed for the default implementation.
*   **Keyboard Navigation**: The button is focusable and can be activated with the `Enter` or `Space` keys.

**Best Practices**

*   Use the `destructive` variant for actions that have a significant and potentially irreversible consequence (e.g., deleting a memory).
*   Use the `link` variant for navigation actions that should look like a hyperlink.
*   Use the `ghost` variant for secondary actions that should not be visually prominent.

### Input

A standard text input field.

**Props Table**

The `Input` component accepts all standard props for an HTML `<input>` element.

| Name   | Type     | Default | Description                                 |
| :----- | :------- | :------ | :------------------------------------------ |
| `type` | `string` | `text`  | The type of input (e.g., `text`, `password`, `email`). |

**State Variations**

*   **Hover**: No specific hover state is defined in the provided CSS.
*   **Focus**: The input field will have a visible ring around it to indicate focus.
*   **Disabled**: The input field will be semi-transparent and will not respond to user input.

**Accessibility (A11y)**

*   **ARIA Roles**: The component renders a standard HTML `<input>` element.  It is recommended to use a `<label>` with the `for` attribute pointing to the `id` of the input to ensure it is properly labeled for screen readers.
*   **Keyboard Navigation**: The input field is focusable.

**Best Practices**

*   Always pair an `Input` with a `Label` component for accessibility.
*   Use the `placeholder` prop to provide a hint to the user about what to enter.

### Card

A flexible container for content. The `Card` component is composed of several sub-components: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, and `CardContent`.

**Props Table**

All `Card` sub-components accept standard HTML `div` attributes.

**Component Structure Example**

```javascript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}
```

**Accessibility (A11y)**

*   **ARIA Roles**:  The component renders standard `div` elements, so no special ARIA roles are applied by default.  You can add roles like `region` or `article` as needed for semantic structure.
*   **Keyboard Navigation**: The card itself is not focusable by default, but its content can be.

**Best Practices**

*   Use `CardHeader` to introduce the content of the card.
*   Use `CardContent` for the main body of the card.
*   Use `CardFooter` for supplementary information or actions related to the card.

---

## Theming & Tokens

To modify the global variables (colors, spacing, typography), you can edit the `tailwind.config.js` file. The theme is defined under the `theme` key. For example, to change the primary color, you would modify the `primary` value in the `colors` object.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ...
      },
    },
  },
};
```
