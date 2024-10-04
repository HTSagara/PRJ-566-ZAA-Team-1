import { useRef } from 'react';
import { 
  Pressable, 
  Text, 
  Animated, 
  type PressableProps, 
  type StyleProp, 
  type ViewProps 
} from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedPressableProps = PressableProps& {
  lightBg?: string;
  lightFg?: string;
  darkBg?: string;
  darkFg?: string;
  title: string;
};

export function ThemedButton({
  style,
  lightBg,
  lightFg,
  darkBg,
  darkFg,
  title,
  onPress,
}: ThemedPressableProps) {

  const fgColor = useThemeColor({ light: lightFg, dark: darkFg }, 'text');
  const bgColor = useThemeColor({ light: lightBg, dark: darkBg }, 'background');

  // Create an animated value for opacity
  const opacity = useRef(new Animated.Value(1)).current;

  const decreaseOpacity = () => {
    Animated.timing(opacity, {
      toValue: 0.3,
      duration: 0,
      useNativeDriver: true,
    }).start();
  };

  const increaseOpacity = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start()
  };

  return (
    <Pressable
      onPressIn={decreaseOpacity}
      onPressOut={increaseOpacity}
      onPress={onPress}
    >
      <Animated.View
        style={[{
          backgroundColor: bgColor,
          paddingVertical: 10,
          paddingHorizontal: 15,
          borderRadius: 3,
          opacity: opacity,
        },
        style as StyleProp<ViewProps>,
      ]}
      >
        <Text
          style={{
            color: fgColor,
            textAlign: "center",
            fontWeight: "bold",
            userSelect: "none"
          }} 
        >
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

