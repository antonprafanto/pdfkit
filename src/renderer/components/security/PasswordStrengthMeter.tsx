/**
 * Password Strength Meter Component
 * Visual indicator for password strength
 */

import { securityService } from '../../lib/security.service';

interface PasswordStrengthMeterProps {
  password: string;
  showSuggestions?: boolean;
}

export function PasswordStrengthMeter({ password, showSuggestions = true }: PasswordStrengthMeterProps) {
  const strength = securityService.calculatePasswordStrength(password);

  // Calculate bar width percentage
 const widthPercentage = (strength.score / 4) * 100;

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${widthPercentage}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>

      {/* Suggestions */}
      {showSuggestions && strength.suggestions.length > 0 && (
        <div className="rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
            Suggestions:
          </p>
          <ul className="mt-1 list-inside list-disc text-xs text-yellow-700 dark:text-yellow-400">
            {strength.suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
