const fs = require('fs');
const path = require('path');

// List of test files to fix
const testFiles = [
  'packages/frontend/src/components/layout/__tests__/Footer.test.tsx',
  'packages/frontend/src/components/layout/__tests__/BottomNavigation.test.tsx',
  'packages/frontend/src/components/layout/__tests__/Sidebar.test.tsx',
  'packages/frontend/src/components/layout/__tests__/Grid.test.tsx',
  'packages/frontend/src/components/form/__tests__/Input.test.tsx',
  'packages/frontend/src/components/form/__tests__/Textarea.test.tsx',
  'packages/frontend/src/components/form/__tests__/Select.test.tsx',
  'packages/frontend/src/components/form/__tests__/Checkbox.test.tsx',
  'packages/frontend/src/components/form/__tests__/RadioButton.test.tsx',
  'packages/frontend/src/components/form/__tests__/Toggle.test.tsx',
  'packages/frontend/src/components/form/__tests__/DatePicker.test.tsx',
  'packages/frontend/src/components/form/__tests__/TimePicker.test.tsx',
  'packages/frontend/src/components/form/__tests__/FileUpload.test.tsx',
  'packages/frontend/src/components/display/__tests__/Modal.test.tsx',
  'packages/frontend/src/components/display/__tests__/Toast.test.tsx',
  'packages/frontend/src/components/display/__tests__/Alert.test.tsx',
  'packages/frontend/src/components/display/__tests__/Badge.test.tsx',
  'packages/frontend/src/components/display/__tests__/Avatar.test.tsx',
  'packages/frontend/src/components/display/__tests__/Skeleton.test.tsx',
  'packages/frontend/src/components/display/__tests__/EmptyState.test.tsx',
  'packages/frontend/src/components/display/__tests__/Pagination.test.tsx',
  'packages/frontend/src/components/display/__tests__/Tabs.test.tsx',
  'packages/frontend/src/components/display/__tests__/Accordion.test.tsx',
  'packages/frontend/src/components/display/__tests__/Carousel.test.tsx',
  'packages/frontend/src/components/a11y/__tests__/LiveRegion.test.tsx',
];

testFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if import already exists
  if (content.includes("from 'vitest'")) {
    console.log(`Skipping ${filePath} - already has vitest import`);
    return;
  }

  // Add vitest imports before the first import statement
  const firstImportMatch = content.match(/^import .+$/m);
  if (firstImportMatch) {
    content = content.replace(
      firstImportMatch[0],
      `import { describe, it, expect, beforeEach } from 'vitest';\n${firstImportMatch[0]}`
    );

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`Warning: Could not find import statement in ${filePath}`);
  }
});

console.log('Done!');
