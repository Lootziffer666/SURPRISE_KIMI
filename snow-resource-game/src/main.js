import './styles/main.css';
import { GameManager } from './core/GameManager.js';

const canvas = document.querySelector('#game-canvas');

if (!canvas) {
  throw new Error('Das Spiele-Canvas wurde nicht gefunden.');
}

const game = new GameManager({ canvas });

game.start();
