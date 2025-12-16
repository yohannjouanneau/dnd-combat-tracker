import { useTranslation } from 'react-i18next';

type Props = {
  active: boolean;
  onToggle: () => void;
};

export default function ConcentrationToggle({ active, onToggle }: Props) {
  const { t } = useTranslation('conditions');

  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1 rounded text-sm transition ${active ? 'bg-accent hover:bg-accent-hover text-accent-text' : 'bg-panel-secondary hover:bg-panel-secondary/80'}`}
    >
      {active ? t('conditions:concentrating') : t('conditions:concentration')}
    </button>
  );
}