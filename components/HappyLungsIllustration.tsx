import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';

type HappyLungsIllustrationProps = Omit<ImageProps, 'source'> & {
  /**
   * Controls the rendered width; height adapts automatically to preserve aspect ratio.
   */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

const HappyLungsIllustration = ({
  size = 200,
  style,
  ...rest
}: HappyLungsIllustrationProps) => {
  const computedStyle: StyleProp<ImageStyle> = [
    {
      width: size,
      height: size,
    },
    style,
  ];

  return (
    <Image
      source={require('@/assets/images/original-lungs.png')}
      resizeMode="contain"
      style={computedStyle}
      {...rest}
    />
  );
};

export default HappyLungsIllustration;
export { HappyLungsIllustration };