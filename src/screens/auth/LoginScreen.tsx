/**
 * LoginScreen — Dark Jewel animated background
 *
 * Pure jewel-tone gradient tiles (no icons, no text) scroll upward
 * continuously. Each tile is a LinearGradient in a rich gem colour —
 * amethyst, sapphire, topaz, emerald, ruby, aquamarine, amber, rose.
 *
 * Seamless loop: duplicate the tile array so the second set starts exactly
 * where the first ends. Animate translateY: 0 → -SET_H, loop resets to 0.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { FontSize, Radius, Spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

// ── Grid constants ─────────────────────────────────────────────────────────
const SW   = Dimensions.get('window').width;
const GAP  = 4;   // black gap between tiles — matches the concept mockup
const COL  = 3;
const TILE = Math.floor((SW - GAP * (COL - 1)) / COL);
const ROWS = 8;
const SET_H = ROWS * (TILE + GAP);  // height of one tile set (incl. trailing gap)

// ── Jewel-tone gem colours ─────────────────────────────────────────────────
// Each entry: [highlight, base, shadow] — diagonal gradient imitates gem facets.
const GEMS: [string, string, string][] = [
  ['#d490ff', '#8030d0', '#2a0060'],  // amethyst
  ['#60a0ff', '#1e56e0', '#040e58'],  // sapphire
  ['#ff9050', '#e03a10', '#6a0e00'],  // topaz / burnt orange
  ['#40e0a0', '#00a060', '#003828'],  // emerald
  ['#ff6080', '#d0084a', '#5a0018'],  // ruby
  ['#40d8f0', '#0090c0', '#003848'],  // aquamarine
  ['#ffd050', '#e09010', '#704000'],  // amber
  ['#ff70d8', '#d01898', '#5a0048'],  // rose
];

// 24 tiles = 8 rows × 3 cols, cycling through the 8 gem colours
const TILE_GEMS: [string, string, string][] = Array.from(
  { length: 24 },
  (_, i) => GEMS[i % GEMS.length]
);
const ALL_GEMS = [...TILE_GEMS, ...TILE_GEMS]; // duplicated for seamless loop

// ── Component ──────────────────────────────────────────────────────────────
type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export function LoginScreen({ navigation }: Props) {
  const { signIn, signInAsGuest } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const insets  = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(scrollY, {
        toValue:         -SET_H,
        duration:        20000,
        easing:          Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [scrollY]);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setError(null);
    setLoading(true);
    const err = await signIn(email.trim().toLowerCase(), password);
    if (err) { setError(err); setLoading(false); }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Jewel tile grid — scrolls upward continuously ─────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[s.tileWrapper, { transform: [{ translateY: scrollY }] }]}
      >
        <View style={s.tileGrid}>
          {ALL_GEMS.map((colors, i) => (
            <LinearGradient
              key={i}
              colors={colors}
              start={{ x: 0.12, y: 0.12 }}
              end={{ x: 0.92, y: 0.92 }}
              style={s.tile}
            />
          ))}
        </View>
      </Animated.View>

      {/* ── Top edge fade ─────────────────────────────────────────────── */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4,4,14,0.7)', 'transparent']}
        style={s.topFade}
      />

      {/* ── Bottom fade: tiles → solid dark behind the login section ──── */}
      {/* Two-layer gradient for a smooth, deep fade */}
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(4,4,14,0.4)', 'rgba(4,4,14,0.85)', '#04040e']}
        locations={[0, 0.2, 0.55, 1]}
        style={s.bottomFade}
      />

      {/* ── Login UI ─────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[s.loginArea, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}>

          {/* LeadCo logo — sits in the solid-dark zone above the card */}
          <View style={s.logoRow}>
            <View style={s.logoCircle}>
              <Text style={s.logoBolt}>⚡</Text>
            </View>
            <View>
              <Text style={s.logoWordmark}>
                <Text style={{ color: '#4E6BDE' }}>Lead</Text>
                <Text style={{ color: '#f97316' }}>Co</Text>
              </Text>
              <Text style={s.logoSub}>MARKETPLACE</Text>
            </View>
          </View>

          {/* Glass login card */}
          <View style={s.card}>
            <View>
              <Text style={s.heading}>Welcome back</Text>
              <Text style={s.subheading}>Sign in to your account</Text>
            </View>

            <View style={s.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureToggle
              />
            </View>

            {error ? (
              <View style={s.errBox}>
                <Text style={s.errText}>{error}</Text>
              </View>
            ) : null}

            <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={s.forgotBtn}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={s.footerSignup}>Sign up free →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={signInAsGuest} style={s.guestBtn}>
            <Text style={s.guestText}>Browse as Guest →</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#04040e',
    overflow:        'hidden',
  },

  // Tile grid
  tileWrapper: {
    position: 'absolute',
    top:      0,
    left:     0,
    width:    SW,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           GAP,
    width:         SW,
    backgroundColor: '#04040e', // shows as gap colour between tiles
  },
  tile: {
    width:        TILE,
    height:       TILE,
    borderRadius: 10,
  },

  // Gradient overlays
  topFade: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   90,
  },
  bottomFade: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   460,  // tall enough to cover logo + card + footer
  },

  // Login area
  kav: {
    flex:           1,
    justifyContent: 'flex-end',
  },
  loginArea: {
    paddingHorizontal: Spacing.lg,
    gap:               14,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    paddingLeft:   2,
  },
  logoCircle: {
    width:           40,
    height:          40,
    borderRadius:    20,
    borderWidth:     2,
    borderColor:     '#4E6BDE',
    backgroundColor: 'rgba(78,107,222,0.20)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoBolt: {
    fontSize:   18,
    lineHeight: 22,
  },
  logoWordmark: {
    fontSize:      28,
    fontWeight:    '800',
    letterSpacing: -0.5,
    lineHeight:    30,
  },
  logoSub: {
    fontSize:      8,
    fontWeight:    '600',
    letterSpacing: 3.5,
    color:         '#9CA3AF',
    marginTop:     1,
  },

  // Card
  card: {
    backgroundColor: 'rgba(5,5,22,0.90)',
    borderRadius:    Radius.xxl,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
    padding:         Spacing.lg - 4,
    gap:             Spacing.md,
  },
  heading: {
    fontSize:   FontSize.xl,
    fontWeight: '700',
    color:      '#e8f4ff',
  },
  subheading: {
    fontSize:  FontSize.sm,
    color:     '#607898',
    marginTop: 2,
  },
  form: { gap: Spacing.sm + 4 },
  errBox: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(248,113,113,0.35)',
    borderRadius:    Radius.md,
    padding:         Spacing.sm + 2,
  },
  errText: { fontSize: FontSize.sm, color: '#F87171' },
  forgotBtn: { alignSelf: 'center', paddingTop: 4 },
  forgotText: {
    fontSize:           FontSize.sm,
    color:              '#587898',
    textDecorationLine: 'underline',
  },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  footerText:   { fontSize: FontSize.sm, color: '#607898' },
  footerSignup: { fontSize: FontSize.sm, color: '#60a5fa', fontWeight: '600' },
  guestBtn:     { alignItems: 'center', paddingVertical: 6 },
  guestText:    {
    fontSize:           FontSize.sm,
    color:              '#507090',
    textDecorationLine: 'underline',
  },
});
