
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, Dimensions, useColorScheme } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { Colors } from '../../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useMemo } from 'react';
import { ConsumptionLog } from '../../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const gap = 16;
const cardSize = (width - 4 * gap) / 2;

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
}

export default function DashboardScreen() {
  const { appState, setAppState } = useAppContext();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const { dailyGoal, currentConsumption, consumptionCounts } = useMemo(() => {
    const preferences = appState.preferences;
    const dailyGoal = preferences?.dailyNicotineGoalMg || 1;
    const todaysConsumptions = (appState.consumptionLog || []).filter(log => isToday(new Date(log.timestamp)));

    const consumptionCounts = {
      Cigarette: 0,
      'Vape (Puff)': 0,
      'Heated Tobacco': 0,
      'Nicotine Pouch': 0,
    };

    let totalNicotine = 0;
    todaysConsumptions.forEach(log => {
        if (log.product in consumptionCounts) {
            consumptionCounts[log.product as keyof typeof consumptionCounts]++;
        }

        switch (log.product) {
            case 'Cigarette':
                totalNicotine += preferences?.nicotineStrengthMgPerCigarette || 0;
                break;
            case 'Vape (Puff)':
                const nicotinePerMl = preferences?.nicotineStrengthMgPerMl || 0;
                const puffsPerPod = preferences?.vapePuffsPerPod || 1;
                const vapeNicotinePerPuff = (nicotinePerMl * 2) / puffsPerPod;
                totalNicotine += vapeNicotinePerPuff || 0;
                break;
            case 'Heated Tobacco':
                totalNicotine += preferences?.nicotineStrengthMgPerHeatedTobacco || 0;
                break;
            case 'Nicotine Pouch':
                totalNicotine += preferences?.nicotineStrengthMgPerPouch || 0;
                break;
        }
    });

    return { dailyGoal, currentConsumption: totalNicotine, consumptionCounts };
  }, [appState.consumptionLog, appState.preferences]);

  const percentage = (currentConsumption / dailyGoal) * 100;

  const handleAddConsumption = (product: string) => {
    const newLog: ConsumptionLog = {
      product,
      timestamp: new Date().toISOString(),
    };

    setAppState(prevState => ({
      ...prevState,
      consumptionLog: [...(prevState.consumptionLog || []), newLog],
    }));
  };

  const consumptionTypes = [
    { name: 'Cigarette', icon: 'smoking', count: consumptionCounts.Cigarette },
    { name: 'Vape (Puff)', icon: 'wind', count: consumptionCounts['Vape (Puff)'] },
    { name: 'Heated Tobacco', icon: 'fire-alt', count: consumptionCounts['Heated Tobacco'] },
    { name: 'Nicotine Pouch', icon: 'grip-lines', count: consumptionCounts['Nicotine Pouch'] },
  ];

  const size = width * 0.58;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, flex: 1 }]}>
        <View style={styles.progressWrapper}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Circle
                    stroke={colorScheme === 'dark' ? '#333333' : '#EEEEEE'}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <Circle
                    stroke={percentage > 100 ? themeColors.error : themeColors.tint}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                />
            </Svg>
            <View style={styles.progressTextContainer}>
                <ThemedText style={styles.progressValue}>
                    {currentConsumption.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.progressLabel}>
                    / {dailyGoal.toFixed(0)}mg Nicotine
                </ThemedText>
            </View>
        </View>

      <View style={styles.gridContainer}>
        <View style={styles.fabContainer}>
            <TouchableOpacity style={[styles.fab, { backgroundColor: themeColors.tint }]} onPress={() => {}} activeOpacity={0.8}>
                <FontAwesome5 name="plus" size={24} color="white" />
            </TouchableOpacity>
        </View>
        <View style={styles.gridRow}>
          <ConsumptionCard style={styles.cardTopLeft} type={consumptionTypes[0]} onPress={() => handleAddConsumption('Cigarette')} />
          <ConsumptionCard style={styles.cardTopRight} type={consumptionTypes[1]} onPress={() => handleAddConsumption('Vape (Puff)')} />
        </View>
        <View style={styles.gridRow}>
          <ConsumptionCard style={styles.cardBottomLeft} type={consumptionTypes[2]} onPress={() => handleAddConsumption('Heated Tobacco')} />
          <ConsumptionCard style={styles.cardBottomRight} type={consumptionTypes[3]} onPress={() => handleAddConsumption('Nicotine Pouch')} />
        </View>
      </View>
    </ThemedView>
  );
}

const ConsumptionCard = ({ type, onPress, style }: { type: { name: string, icon: any, count: number }, onPress: () => void, style: any }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF'}, style]} onPress={onPress}>
            <FontAwesome5 name={type.icon} size={20} color={themeColors.tint} style={{ opacity: 0.9}} />
            <ThemedText style={styles.cardText}>{type.name}</ThemedText>
            <ThemedText style={[styles.cardCount, { color: themeColors.tint }]}>{type.count}</ThemedText>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  progressWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  progressValue: {
    fontSize: 44,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 0,
    padding: 0,
  },
  progressLabel: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
    marginTop: 40,
  },
  gridRow: {
    flexDirection: 'row',
  },
  card: {
    width: cardSize,
    height: cardSize,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 8,
  },
  cardTopLeft: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 75,
    marginRight: gap / 2,
    marginBottom: gap / 2,
  },
  cardTopRight: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 75,
    marginLeft: gap / 2,
    marginBottom: gap / 2,
  },
  cardBottomLeft: {
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 75,
    marginRight: gap / 2,
    marginTop: gap / 2,
  },
  cardBottomRight: {
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 75,
    marginLeft: gap / 2,
    marginTop: gap / 2,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  cardCount: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
  },
  fabContainer: {
    position: 'absolute',
    zIndex: 10,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
});
