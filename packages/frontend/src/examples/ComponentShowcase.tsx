import React, { useState } from 'react';
import {
  Header,
  Footer,
  PageContainer,
  Grid,
  GridItem,
} from '../components/layout';
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioButton,
  Toggle,
  DatePicker,
  TimePicker,
} from '../components/form';
import {
  Modal,
  Toast,
  Alert,
  Badge,
  Avatar,
  Skeleton,
  EmptyState,
  Pagination,
  Tabs,
  Accordion,
} from '../components/display';
import { Button, Card } from '../components/ui';
import type { Tab } from '../components/display/Tabs';
import type { AccordionItem } from '../components/display/Accordion';

/**
 * Component Showcase
 * Demonstrates all Phase 3 components in action
 */
export function ComponentShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const tabs: Tab[] = [
    { id: 'tab1', label: 'Components', content: <div className="p-4">Layout and form components</div> },
    { id: 'tab2', label: 'Examples', content: <div className="p-4">Usage examples</div> },
    { id: 'tab3', label: 'Accessibility', content: <div className="p-4">WCAG 2.1 AA compliance</div> },
  ];

  const accordionItems: AccordionItem[] = [
    { id: 'item1', title: 'What is Community Hub?', content: 'A location-agnostic platform for local business discovery.' },
    { id: 'item2', title: 'How do I list my business?', content: 'Click "List Your Business" in the header to get started.' },
    { id: 'item3', title: 'Is it free?', content: 'Yes, basic listings are completely free for local businesses.' },
  ];

  return (
    <>
      <Header
        platformName="Community Hub"
        showListBusinessCTA={true}
        isAuthenticated={false}
      />

      <PageContainer>
        <div className="py-8 space-y-12">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Component Showcase
            </h1>
            <p className="text-lg text-gray-600">
              All Phase 3 components with WCAG 2.1 AA compliance
            </p>
          </div>

          {/* Alerts */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
            <div className="space-y-4">
              <Alert type="critical" title="Critical Alert" message="This is a critical system alert." />
              <Alert type="warning" message="This is a warning message." />
              <Alert type="advisory" message="This is an advisory notice." />
              <Alert type="info" message="This is an informational message." dismissible onClose={() => {}} />
            </div>
          </section>

          {/* Badges */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Badges</h2>
            <div className="flex gap-4 items-center">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="primary" size="lg">Large</Badge>
            </div>
          </section>

          {/* Avatars */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Avatars</h2>
            <div className="flex gap-4 items-center">
              <Avatar name="John Doe" size="sm" />
              <Avatar name="Jane Smith" size="md" />
              <Avatar name="Bob Johnson" size="lg" />
              <Avatar name="Alice Williams" size="xl" />
            </div>
          </section>

          {/* Form Components */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Form Components</h2>
            <Grid gap="md">
              <GridItem spanMobile={12} spanTablet={6}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  helperText="We'll never share your email"
                />
              </GridItem>

              <GridItem spanMobile={12} spanTablet={6}>
                <Select
                  label="Select Option"
                  options={selectOptions}
                  placeholder="Choose an option..."
                />
              </GridItem>

              <GridItem spanMobile={12} spanTablet={6}>
                <DatePicker label="Event Date" />
              </GridItem>

              <GridItem spanMobile={12} spanTablet={6}>
                <TimePicker label="Event Time" />
              </GridItem>

              <GridItem spanMobile={12}>
                <Textarea
                  label="Description"
                  placeholder="Enter a description..."
                  helperText="Maximum 500 characters"
                  maxLength={500}
                  showCounter
                />
              </GridItem>

              <GridItem spanMobile={12} spanTablet={6}>
                <Checkbox label="I agree to the terms and conditions" />
                <Toggle label="Enable notifications" />
              </GridItem>

              <GridItem spanMobile={12} spanTablet={6}>
                <div className="space-y-2">
                  <RadioButton name="plan" label="Free Plan" />
                  <RadioButton name="plan" label="Premium Plan" />
                  <RadioButton name="plan" label="Enterprise Plan" />
                </div>
              </GridItem>
            </Grid>
          </section>

          {/* Tabs */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Tabs</h2>
            <Tabs tabs={tabs} />
          </section>

          {/* Accordion */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Accordion (FAQ)</h2>
            <Accordion items={accordionItems} />
          </section>

          {/* Pagination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Pagination</h2>
            <Pagination
              currentPage={currentPage}
              totalPages={10}
              onPageChange={setCurrentPage}
            />
          </section>

          {/* Skeleton Loading */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Skeleton Loading</h2>
            <div className="space-y-4">
              <Skeleton variant="text" lines={3} />
              <div className="flex gap-4">
                <Skeleton variant="circular" width={64} height={64} />
                <Skeleton variant="rectangular" width={200} height={100} />
              </div>
            </div>
          </section>

          {/* Empty State */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Empty State</h2>
            <Card>
              <EmptyState
                title="No businesses found"
                description="Try adjusting your search filters or browse all businesses."
                action={<Button>Browse All</Button>}
              />
            </Card>
          </section>

          {/* Modal & Toast Triggers */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Modal & Toast</h2>
            <div className="flex gap-4">
              <Button onClick={() => setModalOpen(true)}>
                Open Modal
              </Button>
              <Button variant="secondary" onClick={() => setToastVisible(true)}>
                Show Toast
              </Button>
            </div>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
            <div className="flex gap-4 flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </section>
        </div>
      </PageContainer>

      <Footer
        platformName="Community Hub"
        socialLinks={[
          { platform: 'Facebook', url: '#' },
          { platform: 'Twitter', url: '#' },
          { platform: 'Instagram', url: '#' },
        ]}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example Modal"
      >
        <p className="mb-4">This is an example modal with focus trap and keyboard support.</p>
        <Input label="Name" placeholder="Enter your name" />
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setModalOpen(false)}>Save</Button>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Toast */}
      <Toast
        message="Action completed successfully!"
        type="success"
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
    </>
  );
}
