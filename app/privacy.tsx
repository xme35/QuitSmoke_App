
import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../components/themed-text';

const PrivacyPolicyScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
            <ThemedText style={styles.title}>Privacy Policy</ThemedText>
            <Text style={styles.lastUpdated}>Last updated: October 28, 2023</Text>

            <View style={styles.section}>
                <Text style={styles.paragraph}>
                    {`Your privacy is important to us. It is QuitNicotine\u2019s policy to respect your privacy regarding any information we may collect from you across our app.`}
                </Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Information We Collect</ThemedText>
                <Text style={styles.paragraph}>
                    {`We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we\u2019re collecting it and how it will be used.`}
                </Text>
                <Text style={styles.paragraph}>
                    {`The data you provide during the onboarding process (such as age, smoking history, and consumption habits) is stored locally on your device and is used to create and manage your personalized quitting plan.`}
                </Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Automated Plan Generation</ThemedText>
                <Text style={styles.paragraph}>
                    {`To generate your personalized tapering schedule, we send a non-identifiable summary of your anonymous data (nicotine intake, quitting pace, etc.) to Google\u2019s generative services.`}
                </Text>
                <Text style={styles.paragraph}>
                    {`We do not send any personal identifiers like your name or email. The sole purpose is to receive the automated response that powers the app\u2019s features. The data is not used for any other purpose. We encourage you to review Google\u2019s Privacy Policy.`}
                </Text>
            </View>
            
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Data Security</ThemedText>
                <Text style={styles.paragraph}>We are committed to protecting your data. All information is stored on your device, and we do not have a central server that collects user data, minimizing the risk of a data breach.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Data Deletion</ThemedText>
                <Text style={styles.paragraph}>
                    {`You have complete control over your data. You can delete your account and all associated information at any time by using the \u201CDelete Account\u201D button in the Profile section. This action is irreversible.`}
                </Text>
            </View>
            
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Changes to This Privacy Policy</ThemedText>
                <Text style={styles.paragraph}>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
                <Text style={styles.paragraph}>If you have any questions about this Privacy Policy, please contact us at: support@quitnicotine.app</Text>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 28,
        paddingTop: 52,
        paddingBottom: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#666',
        marginBottom: 28,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 26,
        color: '#333',
        marginBottom: 12,
    },
});

export default PrivacyPolicyScreen;
