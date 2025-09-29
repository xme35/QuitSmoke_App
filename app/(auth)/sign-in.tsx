import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const SignInScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const auth = getAuth();

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.link}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: '#1e293b',
    },
    input: {
        height: 50,
        borderColor: '#cbd5e1',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
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
    link: {
        color: '#0ea5e9',
        textAlign: 'center',
        fontSize: 16,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 16,
    },
});

export default SignInScreen;
