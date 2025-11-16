import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

const TermsOfServiceScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    return (
        <ThemedView style={{ flex: 1 }}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backButton}>
                    <FontAwesome5 name="arrow-left" size={20} color={themeColors.tint} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Terms of Service</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
            <Text style={styles.lastUpdated}>Last updated: October 28, 2023</Text>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>1. Acceptance of Terms</ThemedText>
                <Text style={styles.paragraph}>
                    {`By accessing or using the QuitNicotine application (\u201cthe App\u201d), you agree to be bound by these Terms of Service (\u201cTerms\u201d). If you disagree with any part of the terms, you may not access the App.`}
                </Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>2. Use of the Application</ThemedText>
                <Text style={styles.paragraph}>The App is intended to provide information and tools to help users manage their nicotine consumption. You agree to use the App for its intended purpose and in compliance with all applicable laws and regulations.</Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>3. Medical Disclaimer</ThemedText>
                <Text style={styles.paragraph}>
                    {`QuitNicotine is not a medical device. The information and plans provided by the App, including those generated automatically, are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.`}
                </Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>4. Limitation of Liability</ThemedText>
                <Text style={styles.paragraph}>
                    {`The developers of QuitNicotine shall not be held liable for any damages, whether direct or indirect, arising from the use or inability to use the App. You assume full responsibility for your use of the App and the information provided therein.`}
                </Text>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>5. Changes to Terms</ThemedText>
                <Text style={styles.paragraph}>
                    {`We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days\u2019 notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.`}
                </Text>
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
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 28,
        paddingTop: 20,
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

export default TermsOfServiceScreen;