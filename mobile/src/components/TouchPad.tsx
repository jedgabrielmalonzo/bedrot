import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState, Vibration } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface Props {
  onMove: (deltaX: number, deltaY: number) => void;
  onTap: () => void;
  onDoubleTap: () => void;
  onTwoFingerTap: () => void;
  onScroll: (deltaY: number) => void;
  sensitivity: number;
}

export function TouchPad({ onMove, onTap, onDoubleTap, onTwoFingerTap, onScroll, sensitivity }: Props) {
  const lastTapTime = useRef(0);
  const moveAccumulated = useRef({ x: 0, y: 0 });
  const touchCount = useRef(1);
  const lastScrollY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (_evt: GestureResponderEvent) => {
        moveAccumulated.current = { x: 0, y: 0 };
        touchCount.current = _evt.nativeEvent.touches?.length || 1;
        lastScrollY.current = 0;
      },

      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const touches = _evt.nativeEvent.touches?.length || 1;
        touchCount.current = touches;

        if (touches >= 2) {
          const scrollDelta = gestureState.dy - lastScrollY.current;
          if (Math.abs(scrollDelta) > 2) {
            onScroll(-scrollDelta * 0.3);
            lastScrollY.current = gestureState.dy;
          }
          return;
        }

        const dx = gestureState.vx * sensitivity * 8;
        const dy = gestureState.vy * sensitivity * 8;
        
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
          onMove(dx, dy);
        }
        
        moveAccumulated.current.x += Math.abs(gestureState.dx);
        moveAccumulated.current.y += Math.abs(gestureState.dy);
      },

      onPanResponderRelease: () => {
        const totalMove = moveAccumulated.current.x + moveAccumulated.current.y;
        
        if (totalMove < 10) {
          if (touchCount.current >= 2) {
            onTwoFingerTap();
            Vibration.vibrate(30);
            return;
          }

          const now = Date.now();
          if (now - lastTapTime.current < 300) {
            onDoubleTap();
            Vibration.vibrate(30);
            lastTapTime.current = 0;
          } else {
            lastTapTime.current = now;
            setTimeout(() => {
              if (lastTapTime.current !== 0 && Date.now() - lastTapTime.current >= 280) {
                onTap();
                Vibration.vibrate(15);
              }
            }, 300);
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.gridLine} />
      <View style={[styles.gridLine, styles.gridLineH]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.touchpad,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.touchpadBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: Colors.touchpadBorder + '30',
  },
  gridLineH: {
    width: '100%',
    height: 1,
  },
});
