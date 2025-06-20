import { GameScene } from '../scenes/GameScene';
import { TrackSegment } from './TrackSegment';
import { gameSettings } from '../config/GameSettings';
import { Util } from './Util';
import { Road } from './Road';

export class Car {
	public scene: GameScene;
	public road: Road;
	public sprite: Phaser.GameObjects.Sprite;
	public offset: number = 0;
	public speed: number = 0;
	public trackPosition: number = 0;
	public percent: number = 0;
	public scale: number = 1500;

	// Merge behavior flags
	public isMerging: boolean = false;
	public hasMerged: boolean = false;
	public targetOffset: number = 0;

	constructor(scene: GameScene, road: Road, offset: number, trackPosition: number, sprite: string, speed: number) {
		this.scene = scene;
		this.road = road;
		this.offset = offset;
		this.speed = speed;
		this.trackPosition = trackPosition;
		this.sprite = this.scene.add.sprite(-999, 999, sprite, 0).setOrigin(0.5, 1);
	}

	public get isOnGravel(): boolean {
		return Math.abs(this.offset) > 1;
	}

	public update(delta: number, carSegment: TrackSegment, playerSegment: TrackSegment, playerOffset: number): void {
		this.updateOffset(delta, carSegment, playerSegment);
		this.updateAngleFrame(carSegment, playerSegment, playerOffset);
	}

	public draw(x: number = 0, y: number = 0, scale: number = 1, segmentClip: number = 0): void {
		const roadCenterX = this.scene.scale.width / 2;
		const roadHalfWidth = gameSettings.roadWidth * scale / 2;
		const screenX = roadCenterX + this.offset * roadHalfWidth;

		this.sprite.setPosition(screenX, y);
		this.sprite.setScale(this.scale * scale);
		this.sprite.setDepth(10 + scale);

		if (!this.sprite.visible) {
			this.sprite.setVisible(true);
		}

		if (y > segmentClip) {
			const clipped = (y - segmentClip) / this.sprite.scaleY;
			const cropY = this.sprite.height - clipped;
			this.sprite.setCrop(0, 0, this.sprite.width, cropY);
		} else {
			this.sprite.setCrop();
		}
	}

	public updateAngleFrame(carSegment: TrackSegment, playerSegment: TrackSegment, playerOffset: number): void {
		const roadDistance = Math.abs(carSegment.index - playerSegment.index);
		const offsetDistance = Math.abs(playerOffset - this.offset);
		const isLeft = playerOffset > this.offset;

		if (roadDistance < 20 && offsetDistance > 0.3) {
			this.sprite.setFrame(1);
			this.sprite.flipX = !isLeft;
		} else {
			this.sprite.setFrame(0);
		}
	}

	public updateOffset(delta: number, carSegment: TrackSegment, playerSegment: TrackSegment): void {
		const lookahead = 50;

		// Skip AI if merging in progress
		if (this.isMerging && !this.hasMerged) return;

		const player = this.scene.player;

		// car not visible, skip AI
		if (carSegment.index - playerSegment.index > gameSettings.drawDistance) return;

		for (let i = 0; i < lookahead; i++) {
			const segment = this.road.segments[(carSegment.index + i) % this.road.segments.length];

			if (segment === playerSegment && this.speed > player.speed && Util.overlapPlayer(player, this)) {
				this.offset = Util.interpolate(this.offset, player.x < this.offset ? 1 : -1, delta * 0.1);
			}

			segment.cars.forEach((otherCar: Car) => {
				if (otherCar === this) return;

				if (this.speed > otherCar.speed && Util.overlapSprite(otherCar.sprite, this.sprite)) {
					this.offset = Util.interpolate(this.offset, otherCar.offset < this.offset ? 1 : -1, delta * 0.1);
				}
			});
		}

		if (Math.abs(this.offset) > 0.9) {
			this.offset = Util.interpolate(this.offset, 0, delta);
		}
	}

	public destroy(): void {
		this.sprite.destroy();
	}
}
