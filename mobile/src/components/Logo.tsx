import React from 'react';
import { View, StyleSheet } from 'react-native';
import LogoImage from '../../img/logo.svg';

// Componente para exibir o logo SVG
interface LogoProps {
  style?: any;
}

export default function Logo({ style }: LogoProps) {
  return (
    <View style={[styles.container, style]}>
      <LogoImage width={200} height={200} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    maxWidth: '80%',
  },
});
