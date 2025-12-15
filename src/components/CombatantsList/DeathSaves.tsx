import { useTranslation } from "react-i18next";
import type { DeathSaves } from "../../types";

type Props = {
  value: DeathSaves;
  onChange: (type: keyof DeathSaves, value: number) => void;
};

export default function DeathSaves({ value, onChange }: Props) {
  const { t } = useTranslation("combat");

  return (
    <div className="mb-4 bg-app-bg rounded p-3 border border-red-500">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-text-muted mb-1">
            {t("combat:deathSaves.successes")}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() =>
                  onChange("successes", value.successes === i ? i - 1 : i)
                }
                className={`w-8 h-8 rounded border-2 transition ${
                  value.successes >= i
                    ? "bg-green-600 border-green-500"
                    : "bg-panel-secondary border-border-secondary"
                }`}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm text-text-muted mb-1">
            {t("combat:deathSaves.failures")}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() =>
                  onChange("failures", value.failures === i ? i - 1 : i)
                }
                className={`w-8 h-8 rounded border-2 transition ${
                  value.failures >= i
                    ? "bg-red-600 border-red-500"
                    : "bg-panel-secondary border-border-secondary"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
