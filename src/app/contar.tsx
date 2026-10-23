import { GameScreen } from '@/components/GameScreen';
import { contar } from '@/games/contar';

export default function ContarScreen() {
  return <GameScreen game={contar} />;
}
