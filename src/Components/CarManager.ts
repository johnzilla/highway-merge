import { Car } from './Car';
import { Road } from './Road';
import { gameSettings } from '../config/GameSettings';
import { GameScene } from '../scenes/GameScene';
import { TrackSegment } from './TrackSegment';
import { Util } from './Util';

export class CarManager {
	public scene: GameScene;
	public cars: Set<Car> = new Set<Car>();

	private road: Road;

	constructor(scene: GameScene, road: Road) {
		this.scene = scene;
		this.road = road;
	}

	public resetCars(): void {
		this.destroy();

for (let i = 0; i < gameSettings.totalCars; i++) {
	const roadOffset = Phaser.Math.FloatBetween(-0.8, 0.8);
  const playerZ = (this.scene.player && this.scene.player.trackPosition) || 0;
  const trackPosition = playerZ + Phaser.Math.Between(300, 2000);
  const spriteString = this.getRandomCarType();
	const speed = Phaser.Math.Between(gameSettings.maxSpeed * 0.2, gameSettings.maxSpeed * 0.8);

	// --- Add merge behavior for ~25% of cars ---
	const shouldMerge = Phaser.Math.Between(0, 3) === 0; // 25% chance

const car = new Car(this.scene, this.road, initialOffset, trackPosition, spriteString, speed);
const carSegment = this.road.findSegmentByZ(trackPosition);

this.cars.add(car);
carSegment.cars.add(car);

// Now assign merge flags
if (shouldMerge) {
	car.isMerging = true;
	car.targetOffset = roadOffset;
}

  // Tween to merge onto the road if needed
	if (shouldMerge) {
		this.scene.tweens.add({
			targets: car,
			offset: roadOffset, // smoothly slide into chosen offset
			duration: 2000,
			ease: 'Sine.easeInOut',
      onComplete: () => {
		    car.hasMerged = true;
	    }
		});
	}
}
	}

	public update(delta: number, playerSegment: TrackSegment, playerOffset: number): void {
		for (const car of this.cars) {
			const oldSegment = this.road.findSegmentByZ(car.trackPosition);

			car.update(delta, oldSegment, playerSegment, playerOffset);
			car.trackPosition = Util.increase(car.trackPosition, delta * car.speed, this.road.trackLength);
			car.percent = Util.percentRemaining(car.trackPosition, gameSettings.segmentLength);

			const newSegment = this.road.findSegmentByZ(car.trackPosition);
			if (newSegment.index !== oldSegment.index) {
				oldSegment.cars.delete(car);
				newSegment.cars.add(car);
			}
		}
	}

	public hideAll(): void {
		this.cars.forEach( (car: Car) => {
			car.sprite.setVisible(false);
		});
	}

	public destroy(): void {
		this.cars.forEach( (car: Car) => car.destroy() );
		this.cars.clear();
	}

	private getRandomCarType(): string {
		const availableSprites = ['car-army', 'car-yellow', 'car-red', 'car-green', 'car-blue'];
		const rndIndex = Phaser.Math.Between(0, availableSprites.length - 1);

		return availableSprites[rndIndex];
	}
}
