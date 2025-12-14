export interface VoiceConfig {
    host: string;
    expert: string;
}

export interface AudioTrack {
    id: string;
    title: string;
    description: string;
    voiceConfig: VoiceConfig;
    transcript: string;
    bucketUrl: string;
    createdAt: number;
}

export interface AudioManifest {
    version: string;
    placements: Record<string, string>; // e.g. "deep-dive-main": "track_id"
    tracks: Record<string, AudioTrack>;
}
