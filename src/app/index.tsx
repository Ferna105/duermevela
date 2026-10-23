import { type Href, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

const GAMES: { href: Href; title: string; hint: string }[] = [
  {
    href: '/imitar',
    title: 'Imitar',
    hint: 'Escuchá el sonido y dibujalo con el dedo: si sube, subí; si baja, bajá.',
  },
  {
    href: '/luz',
    title: 'Luz',
    hint: 'Esperá a oscuras. Cuando sientas luz a través de los párpados, tocá la pantalla.',
  },
  {
    href: '/contar',
    title: 'Contar',
    hint: 'Contá las vibraciones y después tocá la pantalla la misma cantidad de veces.',
  },
  {
    href: '/sostener',
    title: 'Sostener',
    hint: 'Mantené el tono: si se agudiza, deslizá hacia abajo; si se pone grave, hacia arriba.',
  },
];

export default function Menu() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Duermevela</Text>
        <Text style={styles.subtitle}>Elegí un juego, acostate y cerrá los ojos.</Text>
      </View>
      {GAMES.map((game) => (
        <Pressable
          key={game.title}
          onPress={() => router.push(game.href)}
          style={({ pressed }) => [styles.game, pressed && styles.pressed]}
        >
          <Text style={styles.gameTitle}>{game.title}</Text>
          <Text style={styles.hint}>{game.hint}</Text>
        </Pressable>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 4,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 15,
  },
  game: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.pressed,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '400',
  },
  hint: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 21,
  },
});
