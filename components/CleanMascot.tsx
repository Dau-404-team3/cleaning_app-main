import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

type CleanMascotProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function CleanMascot({ size = 82, style }: CleanMascotProps) {
  const unit = size / 82;
  const scale = (value: number) => Math.round(value * unit);

  return (
    <View style={[styles.wrap, { height: size, width: size }, style]}>
      <View
        style={[
          styles.arm,
          styles.leftArm,
          {
            borderRadius: scale(12),
            height: scale(34),
            left: scale(2),
            top: scale(30),
            width: scale(18),
          },
        ]}
      />
      <View
        style={[
          styles.arm,
          styles.rightArm,
          {
            borderRadius: scale(12),
            height: scale(38),
            right: scale(1),
            top: scale(20),
            width: scale(18),
          },
        ]}
      />
      <View
        style={[
          styles.body,
          {
            borderRadius: scale(25),
            height: scale(58),
            left: scale(13),
            top: scale(21),
            width: scale(56),
          },
        ]}
      />
      <View
        style={[
          styles.headBand,
          {
            borderRadius: scale(12),
            height: scale(15),
            left: scale(17),
            top: scale(20),
            width: scale(49),
          },
        ]}
      />
      <View
        style={[
          styles.sproutStem,
          {
            height: scale(18),
            left: scale(51),
            top: scale(4),
            width: scale(5),
          },
        ]}
      />
      <View
        style={[
          styles.leaf,
          styles.leafLeft,
          {
            borderRadius: scale(9),
            height: scale(19),
            left: scale(39),
            top: scale(3),
            width: scale(15),
          },
        ]}
      />
      <View
        style={[
          styles.leaf,
          styles.leafRight,
          {
            borderRadius: scale(9),
            height: scale(19),
            left: scale(54),
            top: scale(1),
            width: scale(15),
          },
        ]}
      />
      <View
        style={[
          styles.eye,
          { height: scale(6), left: scale(31), top: scale(44), width: scale(6) },
        ]}
      />
      <View
        style={[
          styles.eye,
          { height: scale(6), right: scale(31), top: scale(44), width: scale(6) },
        ]}
      />
      <View
        style={[
          styles.cheek,
          { height: scale(6), left: scale(23), top: scale(51), width: scale(8) },
        ]}
      />
      <View
        style={[
          styles.cheek,
          { height: scale(6), right: scale(23), top: scale(51), width: scale(8) },
        ]}
      />
      <Text
        style={[
          styles.mouth,
          {
            fontSize: scale(13),
            left: scale(35),
            top: scale(49),
          },
        ]}
      >
        ∪
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  arm: {
    backgroundColor: '#8BCF7D',
    position: 'absolute',
  },
  body: {
    backgroundColor: '#83CF72',
    borderColor: 'rgba(45,100,52,0.11)',
    borderWidth: 1,
    position: 'absolute',
  },
  cheek: {
    backgroundColor: '#F7B47B',
    borderRadius: 999,
    opacity: 0.92,
    position: 'absolute',
  },
  eye: {
    backgroundColor: '#245B34',
    borderRadius: 999,
    position: 'absolute',
  },
  headBand: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    position: 'absolute',
    transform: [{ rotate: '10deg' }],
  },
  leaf: {
    backgroundColor: '#61B35D',
    position: 'absolute',
  },
  leafLeft: {
    transform: [{ rotate: '-42deg' }],
  },
  leafRight: {
    transform: [{ rotate: '38deg' }],
  },
  leftArm: {
    transform: [{ rotate: '-38deg' }],
  },
  mouth: {
    color: '#245B34',
    fontWeight: '900',
    lineHeight: 17,
    position: 'absolute',
  },
  rightArm: {
    transform: [{ rotate: '42deg' }],
  },
  sproutStem: {
    backgroundColor: '#61B35D',
    borderRadius: 999,
    position: 'absolute',
    transform: [{ rotate: '24deg' }],
  },
  wrap: {
    position: 'relative',
  },
});
