import './styles/main.css';
import { GameManager } from './core/GameManager.js';

const container = document.getElementById('app');
const game = new GameManager(container);
game.start();
