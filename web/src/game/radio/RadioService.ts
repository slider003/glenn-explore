export interface RadioStation {
    id: string;
    label: string;
    url: string;
}

export class RadioService {
    private static instance: RadioService | null = null;
    private audio: HTMLAudioElement | null = null;
    private currentStation: string = 'hiphop';

    private stations: RadioStation[] = [
        {
            id: 'hiphop',
            label: '🎤 Hip-Hop FM',
            url: 'https://streams.ilovemusic.de/iloveradio13.mp3'  // Hip Hop Radio
        },
        {
            id: 'synthwave',
            label: '🌆 Synthwave',
            url: 'http://stream.nightride.fm/nightride.m4a'  // GTA-like retro/synthwave
        },
        {
            id: 'lofi',
            label: '🎧 Lo-Fi',
            url: 'https://streamer.radio.co/s0635c8b0d/listen'
        },
        {
            id: 'chillhop',
            label: '🌊 Chillhop',
            url: 'https://streams.fluxfm.de/Chillhop/mp3-320'
        },
        {
            id: 'jazz',
            label: '🎷 Jazz',
            url: 'https://streaming.radio.co/s774887f7b/listen'
        },
        {
            id: 'electronic',
            label: '💫 Electronic',
            url: 'http://stream.euden.de:8000/electro.mp3'
        },
        {
            id: 'reggae',
            label: '🌴 Reggae Vibes',
            url: 'https://streams.ilovemusic.de/iloveradio09.mp3'
        },
        {
            id: 'rock',
            label: '🎸 Rock Radio',
            url: 'https://streams.ilovemusic.de/iloveradio21.mp3'
        }
    ];

    private constructor() {
        this.initializeAudio();
    }

    public static getInstance(): RadioService {
        if (!RadioService.instance) {
            RadioService.instance = new RadioService();
        }
        return RadioService.instance;
    }

    private initializeAudio(): void {
        this.audio = new Audio();
        this.audio.volume = 0.15;
        const currentStation = this.stations.find(s => s.id === this.currentStation);
        if (currentStation) {
            this.audio.src = currentStation.url;
        }
    }

    public getStations(): RadioStation[] {
        return this.stations;
    }

    public getCurrentStation(): string {
        return this.currentStation;
    }

    public isPlaying(): boolean {
        return this.audio ? !this.audio.paused : false;
    }

    public getVolume(): number {
        return this.audio ? this.audio.volume : 0.3;
    }

    public play(): void {
        this.audio?.play();
    }

    public pause(): void {
        this.audio?.pause();
    }

    public setVolume(volume: number): void {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    public changeStation(stationId: string): void {
        const station = this.stations.find(s => s.id === stationId);
        if (!station || !this.audio) return;

        const wasPlaying = !this.audio.paused;
        this.currentStation = stationId;
        this.audio.src = station.url;

        if (wasPlaying) {
            this.audio.play();
        }
    }

    public destroy(): void {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        RadioService.instance = null;
    }
} 