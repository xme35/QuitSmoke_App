import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

const TermsOfServiceScreen: React.FC = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Terms of Service for QuitTrack</Text>
                    <Text style={styles.headerSubtitle}>Last Updated: July 29, 2024</Text>
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.paragraph}>Welcome to QuitTrack. These terms and conditions outline the rules and regulations for the use of our application.</Text>
                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                        <Text style={styles.paragraph}>By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this application.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Description of Service</Text>
                        <Text style={styles.paragraph}>QuitTrack is a habit-tracking tool designed to help users monitor and reduce their nicotine consumption. The application provides features for logging, goal setting, and visualizing progress. It uses an AI (Google Gemini) to generate personalized, non-medical quitting plans based on user-provided data.</Text>
                    </View>

                    <View style={[styles.section, styles.disclaimerSection]}>
                        <Text style={[styles.sectionTitle, styles.disclaimerTitle]}>3. Disclaimer: Not Medical Advice</Text>
                        <Text style={styles.disclaimerText}><Text style={styles.bold}>QuitTrack is not a medical device and is not a substitute for professional medical advice, diagnosis, or treatment.</Text></Text>
                        <Text style={styles.disclaimerText}>The information, plans, and summaries provided by this application, including all AI-generated content, are for informational and motivational purposes only. Always seek the advice of your physician or another qualified health provider with any questions you may have regarding a medical condition or your journey to quit nicotine. Never disregard professional medical advice or delay in seeking it because of something you have used or read in this application.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
                        <Text style={styles.paragraph}>You are responsible for the accuracy of the information you provide during the onboarding process. The effectiveness of the personalized plan depends on the data you supply. You use this application and the information it provides at your own risk.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
                        <Text style={styles.paragraph}>In no event shall QuitTrack or its creators be liable for any direct, indirect, incidental, special, or consequential damages arising out of, or in any way connected with, the use of this application or with the delay or inability to use this application. Your sole remedy for dissatisfaction with the application is to stop using it.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. Changes to Terms</Text>
                        <Text style={styles.paragraph}>We reserve the right to modify these terms from time to time at our sole discretion. Therefore, you should review this page periodically. Your continued use of the Application after any such change constitutes your acceptance of the new Terms.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>7. Contact Us</Text>
                        <Text style={styles.paragraph}>If you have any questions about these Terms, please contact us at: <Text style={styles.link}>support@quittrack.example.com</Text> (placeholder).</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    innerContainer: {
        padding: 16,
        maxWidth: 800,
        alignSelf: 'center',
    },
    header: {
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1e293b',
    },
    headerSubtitle: {
        textAlign: 'center',
        color: '#64748b',
        marginTop: 8,
    },
    contentContainer: {
        // Styles for the main content area
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1e293b',
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        color: '#334155',
    },
    disclaimerSection: {
        backgroundColor: '#fee2e2', // red-100
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f87171', // red-400
    },
    disclaimerTitle: {
        color: '#b91c1c', // accent
    },
    disclaimerText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#b91c1c',
    },
    bold: {
        fontWeight: 'bold',
    },
    link: {
        color: '#0ea5e9',
    },
});

export default TermsOfServiceScreen;
