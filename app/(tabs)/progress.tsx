import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/context/AppContext';
import { FC } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const Page: FC = () => {
    const { logs } = useApp();

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.logItem}>
            <ThemedText style={styles.logDate}>{new Date(item.date).toLocaleString()}</ThemedText>
            <View style={styles.logDetails}>
                <ThemedText>Craving interval: {item.craving} minutes</ThemedText>
                <ThemedText>Cigarettes not smoked: {item.cigarettesNotSmoked}</ThemedText>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <Text style={styles.title}>Progress</Text>
            <FlatList
                data={logs}
                renderItem={renderItem}
                keyExtractor={(item) => item.date}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No logs yet.</ThemedText>}
            />
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
    logItem: {
        backgroundColor: '#f1f5f9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    logDate: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    logDetails: {},
    emptyText: {
        textAlign: 'center',
        marginTop: 24,
    },
});

export default Page;
