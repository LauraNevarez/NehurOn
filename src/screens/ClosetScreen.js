import React, {useState} from 'react';
import {View, Text, Pressable, FlatList, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SvgXml} from 'react-native-svg';
import AvatarView from '../components/AvatarView';
import useUserStore from '../store/useUserStore';
import {SHOP_ITEMS, AVATAR_BG_COLORS} from '../data/shopItems';
import {ACCESSORY_SVGS} from '../assets/mascota/accessories';
import {colors, radius} from '../theme';

const TABS = [
  {key: 'hat', label: 'Cabeza'},
  {key: 'glasses', label: 'Ojos'},
  {key: 'mouth', label: 'Boca'},
  {key: 'bg', label: 'Fondo'},
];

export default function ClosetScreen() {
  const points = useUserStore(s => s.points);
  const unlockedItems = useUserStore(s => s.unlockedItems);
  const equipped = useUserStore(s => s.equipped) || {};
  const equippedHat = useUserStore(s => s.equippedHat);
  const equippedGlasses = useUserStore(s => s.equippedGlasses);
  const purchaseOrToggle = useUserStore(s => s.purchaseOrToggle);
  const setAvatarBgColor = useUserStore(s => s.setAvatarBgColor);
  const [tab, setTab] = useState('hat');

  const onPressItem = item => {
    const owned = unlockedItems.includes(item.id);

    if (owned) {
      purchaseOrToggle(item); // equipa / desequipa
      return;
    }
    if (points < item.price) {
      Alert.alert('Puntos insuficientes', `Te faltan ${item.price - points} puntos para "${item.name}".`);
      return;
    }
    Alert.alert('Comprar', `¿Comprar "${item.name}" por ${item.price} puntos?`, [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Comprar', onPress: () => purchaseOrToggle(item)},
    ]);
  };

  const data = tab === 'bg' ? AVATAR_BG_COLORS : SHOP_ITEMS.filter(i => i.category === tab);
  const currentBg = equipped?.bg || 'transparent';

  const renderAccessoryItem = ({item}) => {
    const owned = unlockedItems.includes(item.id);
    const isEquipped =
      equipped[item.category] === item.id ||
      (item.category === 'hat' && equippedHat === item.id) ||
      (item.category === 'glasses' && equippedGlasses === item.id);
    const svgXml = item.svgXml || ACCESSORY_SVGS[item.id];

    return (
      <Pressable style={[styles.item, isEquipped && styles.itemOn]} onPress={() => onPressItem(item)}>
        <View style={styles.itemImgBox}>
          {svgXml ? (
            <SvgXml xml={svgXml} width={64} height={64} />
          ) : (
            <Icon name="tag" size={32} color={colors.muted} />
          )}
        </View>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        {isEquipped ? (
          <Text style={[styles.tag, {color: colors.success}]}>Equipado</Text>
        ) : owned ? (
          <Text style={[styles.tag, {color: colors.muted}]}>Equipar</Text>
        ) : (
          <Text style={[styles.tag, {color: points >= item.price ? colors.accent : colors.danger}]}>
            🪙 {item.price}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderColorItem = ({item}) => {
    const isSelected = currentBg === item.hex;
    const isTransparent = item.hex === 'transparent';

    return (
      <Pressable
        style={[styles.item, isSelected && styles.itemOn]}
        onPress={() => setAvatarBgColor(item.hex)}>
        <View
          style={[
            styles.colorCircle,
            {
              backgroundColor: isTransparent ? colors.cardAlt : item.hex,
              borderColor: isSelected ? colors.success : colors.border,
            },
          ]}>
          {isSelected ? (
            <Icon
              name="check"
              size={28}
              color={isTransparent ? colors.success : '#FFFFFF'}
            />
          ) : isTransparent ? (
            <Icon name="cancel" size={24} color={colors.muted} />
          ) : null}
        </View>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.tag, {color: isSelected ? colors.success : colors.muted}]}>
          {isSelected ? 'Activo' : 'Gratis'}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Armario</Text>
        <View style={styles.points}>
          <Icon name="star-circle" size={18} color={colors.accent} />
          <Text style={styles.pointsText}> {points}</Text>
        </View>
      </View>

      <View
        style={[
          styles.avatarBox,
          currentBg && currentBg !== 'transparent' && {backgroundColor: currentBg},
        ]}>
        <AvatarView size={230} equipped={equipped} hatId={equippedHat} glassesId={equippedGlasses} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t, idx) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              styles.tab,
              idx === TABS.length - 1 && {marginRight: 0},
              tab === t.key && styles.tabOn,
            ]}>
            <Text style={[styles.tabText, tab === t.key && {color: '#1A1200'}]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        key={tab}
        data={data}
        numColumns={3}
        keyExtractor={i => i.id}
        renderItem={tab === 'bg' ? renderColorItem : renderAccessoryItem}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={false}
        contentContainerStyle={{padding: 12}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16},
  title: {color: colors.text, fontSize: 24, fontWeight: '800'},
  points: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20},
  pointsText: {color: colors.text, fontWeight: '700'},
  avatarBox: {alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, borderRadius: radius.lg, paddingVertical: 10},
  tabs: {flexDirection: 'row', marginHorizontal: 16, marginTop: 14},
  tab: {flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, marginRight: 6},
  tabOn: {backgroundColor: colors.accent},
  tabText: {color: colors.text, fontWeight: '700', fontSize: 13},
  item: {
    width: '31%', margin: '1.1%', backgroundColor: colors.card, borderRadius: radius.md, padding: 8,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  itemOn: {borderColor: colors.success},
  itemImgBox: {
    width: 70, height: 70, backgroundColor: colors.cardAlt, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  colorCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginVertical: 7,
  },
  itemName: {color: colors.text, fontSize: 11, fontWeight: '600', marginTop: 6, textAlign: 'center'},
  tag: {fontSize: 12, fontWeight: '700', marginTop: 2},
});
