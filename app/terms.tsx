
import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { ThemedText } from '../components/themed-text';

const TermsOfServiceScreen = () => {
    return (
        <ScrollView style={styles.container}>
            <ThemedText style={styles.title}>Terms of Service</ThemedText>
            <Text style={styles.lastUpdated}>Last updated: October 28, 2023</Text>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>1. Acceptance of Terms</ThemedText>
                <Text style={styles.paragraph}>By accessing or using the QuitNicotine application ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the App.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>2. Use of the Application</ThemedText>
                <Text style={styles.paragraph}>The App is intended to provide information and tools to help users manage their nicotine consumption. You agree to use the App for its intended purpose and in compliance with all applicable laws and regulations.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>3. Medical Disclaimer</ThemedText>
                <Text style={styles.paragraph}>QuitNicotine is not a medical device. The information and plans provided by the App, including those generated automatically, are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>4. Limitation of Liability</ThemedText>
                <Text style={styles.paragraph}>The developers of QuitNicotine shall not be held liable for any damages, whether direct or indirect, arising from the use or inability to use the App. You assume full responsibility for your use of the App and the information provided therein.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>5. Changes to Terms</ThemedText>
                <Text style={styles.paragraph}>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>6. Governing Law</ThemedText>
                <Text style={styles.paragraph}>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the developers are based, without regard to its conflict of law provisions.</Text>
            </View>

             <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
                <Text style={styles.paragraph}>If you have any questions about these Terms, please contact us at: support@quitnicotine.app</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
});

export default TermsOfServiceScreen;
