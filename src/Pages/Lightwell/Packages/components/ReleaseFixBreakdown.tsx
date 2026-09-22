import { Content, Flex, FlexItem, Icon, Title } from '@patternfly/react-core';
import {
  RhUiCheckCircleFillIcon,
  RhUiSecuredIcon,
  SeverityCriticalIcon,
  SeverityImportantIcon,
  SeverityModerateIcon,
} from '@patternfly/react-icons';
import {
  t_global_background_color_100,
  t_global_border_color_status_success_default,
} from '@patternfly/react-tokens';
import flex from '@patternfly/react-styles/css/utilities/Flex/flex';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import type { ReactNode } from 'react';

const successBorderColor = t_global_border_color_status_success_default.var;
const backgroundColor = t_global_background_color_100.var;

type FixCountBySeverityProps = {
  total: number;
  severity: ReactNode;
};

const FixCountBySeverity = ({ total, severity }: FixCountBySeverityProps) => (
  <Flex
    direction={{ default: 'column' }}
    gap={{ default: 'gapXs' }}
    alignItems={{ default: 'alignItemsCenter' }}
  >
    <Title headingLevel='h4' size='3xl'>
      {total}
    </Title>
    {severity}
  </Flex>
);

const ReleaseFixBreakdown = () => (
  <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
    <FlexItem>
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        gap={{ default: 'gapSm' }}
        height='fit-content'
      >
        <Icon size='xl' status='success'>
          <RhUiSecuredIcon />
        </Icon>
        <Title headingLevel='h3' size='xl'>
          2 new backported fixes in this release
        </Title>
      </Flex>
    </FlexItem>

    <FlexItem
      style={{
        position: 'relative',
        width: '394px',
        maxWidth: '100%',
        height: 'calc(99px + var(--pf-t--global--icon--size--xl) / 2)',
      }}
    >
      <Flex
        className={`${spacing.pMd} ${flex.flexWrap}`}
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceAround' }}
        style={{
          height: '99px',
          border: `1px solid ${successBorderColor}`,
          borderRadius: 'var(--pf-t--global--border--radius--medium)',
        }}
      >
        <FlexItem>
          <FixCountBySeverity
            total={88}
            severity={
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                <Icon size='sm'>
                  <SeverityCriticalIcon />
                </Icon>
                <Content>Critical</Content>
              </Flex>
            }
          />
        </FlexItem>
        <FlexItem>
          <FixCountBySeverity
            total={88}
            severity={
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                <Icon size='sm'>
                  <SeverityImportantIcon />
                </Icon>
                <Content>Important</Content>
              </Flex>
            }
          />
        </FlexItem>
        <FlexItem>
          <FixCountBySeverity
            total={88}
            severity={
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                <Icon size='sm'>
                  <SeverityModerateIcon />
                </Icon>
                <Content>Moderate</Content>
              </Flex>
            }
          />
        </FlexItem>
      </Flex>
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          lineHeight: 0,
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: '12%',
            backgroundColor,
            borderRadius: '50%',
          }}
        />
        <Icon size='xl' status='success'>
          <RhUiCheckCircleFillIcon />
        </Icon>
      </span>
    </FlexItem>

    <FlexItem>
      <Content>
        If a low fix is done or if a release is done without a fix we can say things here
      </Content>
    </FlexItem>
  </Flex>
);

export default ReleaseFixBreakdown;
