type StepperStatus = 'default' | 'current' | 'completed' | 'upcoming' | 'error';
type StepperMarkerVariant = 'default' | 'outline' | 'ghost';
type StepperMarkerSize = 'default' | 'sm' | 'lg' | 'icon';
type StepperConnectorVariant = 'solid' | 'dashed';
type StepperOrientation = 'vertical' | 'horizontal';

interface StepperContextValue {
  orientation: StepperOrientation;
}

interface StepperItemContextValue {
  status: StepperStatus;
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default vertical */
  orientation?: StepperOrientation;
  asChild?: boolean;
}

interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: StepperStatus;
  asChild?: boolean;
}

interface StepperTrackProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

interface StepperConnectorProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StepperConnectorVariant;
  asChild?: boolean;
}

interface StepperMarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StepperMarkerVariant;
  size?: StepperMarkerSize;
  asChild?: boolean;
}

interface StepperContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export type {
  StepperStatus,
  StepperMarkerVariant,
  StepperMarkerSize,
  StepperConnectorVariant,
  StepperOrientation,
  StepperContextValue,
  StepperItemContextValue,
  StepperProps,
  StepperItemProps,
  StepperTrackProps,
  StepperConnectorProps,
  StepperMarkerProps,
  StepperContentProps
};
