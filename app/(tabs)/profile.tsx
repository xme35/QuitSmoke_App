
import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, TextInput, Switch, Alert, useColorScheme } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAppContext, TaperingPhase, initialAppState } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { clearLoginStatus } from '@/helpers/login-status';
import { clearOnboardingStatus, setOnboardingStatus } from '@/helpers/onboarding-status';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';

const getDailyLimitForDate = (
    date: Date,
    planStartDate?: string | null,
    taperingSchedule?: TaperingPhase[] | null,
): number => {
    if (!planStartDate || !taperingSchedule || taperingSchedule.length === 0) return 0;

    const startDate = new Date(planStartDate);
    const daysIntoPlan = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    if (Number.isNaN(daysIntoPlan)) return 0;

    if (daysIntoPlan < 0) {
        const firstPhase = taperingSchedule[0];
        if (!firstPhase) return 0;
        if (Array.isArray(firstPhase.dailyTargetsMg) && firstPhase.dailyTargetsMg.length > 0) {
            return firstPhase.dailyTargetsMg[0];
        }
        return firstPhase.nicotineGoalMg;
    }

    let cumulativeDays = 0;
    for (const phase of taperingSchedule) {
        const phaseStartIndex = cumulativeDays;
        cumulativeDays += phase.durationDays;

        if (daysIntoPlan < cumulativeDays) {
            const dayIndexWithinPhase = daysIntoPlan - phaseStartIndex;
            if (Array.isArray(phase.dailyTargetsMg) && phase.dailyTargetsMg.length === phase.durationDays) {
                const target = phase.dailyTargetsMg[Math.min(Math.max(dayIndexWithinPhase, 0), phase.dailyTargetsMg.length - 1)];
                return Math.max(0, target);
            }
            return phase.nicotineGoalMg;
        }
    }

    const lastPhase = taperingSchedule[taperingSchedule.length - 1];
    if (!lastPhase) return 0;
    if (Array.isArray(lastPhase.dailyTargetsMg) && lastPhase.dailyTargetsMg.length > 0) {
        return lastPhase.dailyTargetsMg[lastPhase.dailyTargetsMg.length - 1];
    }
    return lastPhase.nicotineGoalMg;
};

interface ConfirmationModalProps {
  visible: boolean;
  onclose: () => void;
  onconfirm: () => void;
  title: string;
  challengeText: string;
  confirmation: string;
  setconfirmation: (text: string) => void;
  buttonlabel: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ visible, onclose, onconfirm, title, challengeText, confirmation, setconfirmation, buttonlabel }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onclose}
        >
            <View style={styles.modalContainer}>
                <ThemedView style={[styles.modalView, { backgroundColor: themeColors.background }]}>
                    <ThemedText style={styles.modalTitle}>{title}</ThemedText>
                    <ThemedText style={styles.modalText}>
                        This action is irreversible. To confirm, please type '{challengeText}' in the box below.
                    </ThemedText>
                    <TextInput
                        style={[styles.input, { borderColor: themeColors.secondaryText, color: themeColors.text }]}
                        placeholder={challengeText}
                        placeholderTextColor={themeColors.secondaryText}
                        value={confirmation}
                        onChangeText={setconfirmation}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={[styles.button, confirmation.toLowerCase() !== challengeText ? { backgroundColor: themeColors.secondaryText } : { backgroundColor: themeColors.error }]}
                        onPress={onconfirm}
                        disabled={confirmation.toLowerCase() !== challengeText}
                    >
                        <ThemedText style={styles.buttonText}>{buttonlabel}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: themeColors.icon }]}
                        onPress={onclose}
                    >
                        <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </View>
        </Modal>
    );
};


export default function ProfileScreen() {
    const { appState, setAppState, user } = useAppContext();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const { planStartDate, totalDuration, taperingSchedule, initialIntake } = appState;

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [newPlanModalVisible, setNewPlanModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [newPlanConfirmation, setNewPlanConfirmation] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const planDetails = useMemo(() => {
        const quitDate = new Date(planStartDate || Date.now());
        if (planStartDate && totalDuration) {
            quitDate.setDate(quitDate.getDate() + totalDuration);
        }
        return {
            initialIntake: initialIntake || 0,
            currentLimit: getDailyLimitForDate(new Date(), planStartDate, taperingSchedule),
            targetQuitDate: planStartDate ? quitDate.toLocaleDateString() : 'N/A',
        };
    }, [planStartDate, totalDuration, taperingSchedule, initialIntake]);

    const handleLogout = async () => {
        try {
            setAppState(initialAppState);
            await clearLoginStatus();
            await clearOnboardingStatus(user?.uid);
            await signOut(auth);
            router.replace('/(auth)/sign-in' as any);
            Alert.alert('Logged Out', 'You have been successfully logged out.');
        } catch (error) {
            console.error("Error signing out: ", error);
            Alert.alert('Error', 'Could not log out. Please try again.');
        }
    };

    const handleResetPlan = async () => {
        if (newPlanConfirmation.toLowerCase() === 'new plan') {
            setAppState(prevState => ({
                ...initialAppState,
                name: prevState.name,
            }));
            await setOnboardingStatus(false, user?.uid);
            setNewPlanModalVisible(false);
            setNewPlanConfirmation('');
            router.replace('/(onboarding)/welcome' as any);
        } else {
            Alert.alert('Incorrect Confirmation', 'Please type "new plan" to confirm.');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation.toLowerCase() === 'delete') {
            try {
                setDeleteModalVisible(false);
                setDeleteConfirmation('');
                setAppState(initialAppState);
                await clearLoginStatus();
                await clearOnboardingStatus(user?.uid);
                await signOut(auth);
                router.replace('/(auth)/sign-in' as any);
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
            } catch (error) {
                console.error("Error deleting account: ", error);
                Alert.alert('Error', 'Could not delete your account. Please try again.');
            }
        } else {
            Alert.alert('Incorrect Confirmation', 'Please type "delete" to confirm.');
        }
    };

    const cardStyle = {
        backgroundColor: colorScheme === 'light' ? '#FFFFFF' : '#1F2933',
        ...styles.card
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: themeColors.background }}>
            <ConfirmationModal
                visible={newPlanModalVisible}
                onclose={() => setNewPlanModalVisible(false)}
                onconfirm={handleResetPlan}
                title="Start a New Plan?"
                challengeText="new plan"
                confirmation={newPlanConfirmation}
                setconfirmation={setNewPlanConfirmation}
                buttonlabel="Confirm and Start Over"
            />
            <ConfirmationModal
                visible={deleteModalVisible}
                onclose={() => setDeleteModalVisible(false)}
                onconfirm={handleDeleteAccount}
                title="Delete Account?"
                challengeText="delete"
                confirmation={deleteConfirmation}
                setconfirmation={setDeleteConfirmation}
                buttonlabel="Confirm and Delete"
            />

            <ThemedView style={cardStyle}>
                <ThemedText style={styles.sectionTitle}>My Plan</ThemedText>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Initial Daily Intake</ThemedText>
                    <ThemedText style={styles.infoValue}>{planDetails.initialIntake.toFixed(1)} mg</ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Current Daily Limit</ThemedText>
                    <ThemedText style={styles.infoValue}>{planDetails.currentLimit.toFixed(1)} mg</ThemedText>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <ThemedText style={styles.infoLabel}>Target Quit Date</ThemedText>
                    <ThemedText style={styles.infoValue}>{planDetails.targetQuitDate}</ThemedText>
                </View>
            </ThemedView>

            <ThemedView style={cardStyle}>
                <ThemedText style={styles.sectionTitle}>Actions</ThemedText>
                <TouchableOpacity style={styles.actionButton} onPress={() => setNewPlanModalVisible(true)}>
                    <FontAwesome5 name="redo" size={16} color={themeColors.tint} />
                    <ThemedText style={[styles.actionButtonText, { color: themeColors.tint }]}>Start a New Plan</ThemedText>
                </TouchableOpacity>
            </ThemedView>

            <ThemedView style={cardStyle}>
                <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
                <View style={styles.settingRow}>
                    <FontAwesome5 name="bell" size={16} color={themeColors.icon} />
                    <ThemedText style={styles.settingLabel}>Enable Notifications</ThemedText>
                    <Switch
                        trackColor={{ false: "#767577", true: themeColors.tint }}
                        thumbColor={notificationsEnabled ? themeColors.tint : "#f4f3f4"}
                        onValueChange={() => setNotificationsEnabled(previousState => !previousState)}
                        value={notificationsEnabled}
                    />
                </View>
            </ThemedView>

            <ThemedView style={cardStyle}>
                <ThemedText style={styles.sectionTitle}>Legal</ThemedText>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/privacy')}>
                    <FontAwesome5 name="shield-alt" size={16} color={themeColors.icon} />
                    <ThemedText style={[styles.actionButtonText, {color: themeColors.icon}]}>Privacy Policy</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, {marginTop: 10}]} onPress={() => router.push('/terms')}>
                    <FontAwesome5 name="file-contract" size={16} color={themeColors.icon} />
                    <ThemedText style={[styles.actionButtonText, {color: themeColors.icon}]}>Terms of Service</ThemedText>
                </TouchableOpacity>
            </ThemedView>

            <ThemedView style={cardStyle}>
                <ThemedText style={styles.sectionTitle}>Account</ThemedText>
                <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                    <FontAwesome5 name="sign-out-alt" size={16} color={themeColors.error} />
                    <ThemedText style={[styles.actionButtonText, { color: themeColors.error }]}>Logout</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, {marginTop: 10}]} onPress={() => setDeleteModalVisible(true)}>
                    <FontAwesome5 name="trash" size={16} color={themeColors.error} />
                    <ThemedText style={[styles.actionButtonText, { color: themeColors.error }]}>Delete Account</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    card: { 
        marginHorizontal: 15, 
        marginVertical: 10, 
        borderRadius: 12, 
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    infoLabel: { fontSize: 16, opacity: 0.8 },
    infoValue: { fontSize: 16, fontWeight: 'bold' },
    actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5, borderRadius: 8 },
    actionButtonText: { fontSize: 16, marginLeft: 10 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    settingLabel: { fontSize: 16, flex: 1, marginLeft: 10 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, borderRadius: 20, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    modalText: { marginBottom: 15, textAlign: 'center' },
    input: { height: 50, width: '100%', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, textAlign: 'center' },
    button: { borderRadius: 10, padding: 15, elevation: 2, width: '100%', alignItems: 'center', marginBottom: 10 },
    buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
});
