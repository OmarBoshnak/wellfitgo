import React from 'react';
import { Switch } from 'react-native';
import { colors } from '@/src/core/constants/Themes';

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (value: boolean) => void;
    isRTL?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, isRTL }) => {
    return (
        <Switch
            trackColor={{ false: '#767577', true: colors.primaryDark }}
            thumbColor={colors.white}
            onValueChange={onChange}
            value={enabled}
        />
    );
};

export default ToggleSwitch;

