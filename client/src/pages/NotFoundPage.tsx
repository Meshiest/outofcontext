import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cn } from '@/components/lib/cn';
import { PageWrapper } from '@/components/widgets/PageWrapper';
import { MenuLayout } from '@/components/widgets/MenuLayout';
import { Icon } from '@/components/ui/Icon/Icon';
import type { IconName } from '@/components/ui/Icon/icon-map';

// Navigating controls are real anchors styled to read as buttons (same pressed-smooth skin as Button).
const LINK_BUTTON_CLASS =
  'relative inline-flex w-full select-none items-center justify-center gap-2 h-11 rounded-md border px-4 text-[13px] font-sans font-bold uppercase leading-none tracking-[0.1em] whitespace-nowrap btn-skin';

function LinkButton({
  to,
  href,
  icon,
  skin = 'btn-neutral',
  children,
}: {
  to?: string;
  href?: string;
  icon?: IconName;
  skin?: string;
  children: ReactNode;
}) {
  const className = cn(LINK_BUTTON_CLASS, skin);
  const inner = (
    <>
      {icon && <Icon name={icon} size="sm" className="btn-ico" />}
      <span>{children}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={to ?? '/'} className={className}>
      {inner}
    </Link>
  );
}

/** Catch-all route: a friendly dead end with a way home and a link to file a bug. */
export function NotFoundPage() {
  const { t } = useTranslation('notFound');

  return (
    <PageWrapper>
      <MenuLayout title={t('title')} subtitle={t('subtitle')}>
        <div className="flex flex-col gap-2">
          <LinkButton to="/" skin="btn-primary">
            {t('home')}
          </LinkButton>
          <LinkButton href="https://github.com/meshiest/outofcontext/issues" icon="bug">
            {t('bugReport')}
          </LinkButton>
        </div>
      </MenuLayout>
    </PageWrapper>
  );
}
