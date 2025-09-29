import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/context/AppContext';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { FC, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

const Page: FC = () => {
    const { settings, updateSettings } = useApp();
    const [cravingInterval, setCravingInterval] = useState(settings.cravingIntervalMinutes?.toString() || '20');
    const [cigarettesNotSmoked, setCigarettesNotSmoked] = useState(settings.cigarettesNotSmoked?.toString() || '20');
    const router = useRouter();
    const auth = getAuth();

    const handleSave = () => {
        updateSettings({
            cravingIntervalMinutes: parseInt(cravingInterval, 10),
            cigarettesNotSmoked: parseInt(cigarettesNotSmoked, 10),
        });
    };

    const handleSignOut = () => {
        signOut(auth).then(() => {
            router.replace('/(auth)/sign-in');
        });
    };

    return (
        <ThemedView style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Craving Interval (minutes)</ThemedText>
                <TextInput
                    style={styles.input}
                    value={cravingInterval}
                    onChangeText={setCravingInterval}
                    keyboardType="numeric"
                />
            </ThemedView>
            <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Cigarettes Not Smoked (daily)</ThemedText>
                <TextInput
                    style={styles.input}
                    value={cigarettesNotSmoked}
                    onChangeText={setCigarettesNotSmoked}
                    keyboardType="numeric"
                />
            </ThemedView>
            <Pressable style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.signOutButton]} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sign Out</Text>
            </Pressable>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderColor: '#cbd5e1',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#0ea5e9',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signOutButton: {
        backgroundColor: '#e53e3e',
    },
});

export default Page;
