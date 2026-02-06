type Stored = {
	token: string;
	userId?: string;
	revoked?: boolean;
	expiresAt?: number;
};

const store = new Map<string, Stored>();

export class RefreshTokensRepository {
	async save(token: string, userId?: string, expiresAt?: number) {
		store.set(token, { token, userId, revoked: false, expiresAt });
	}

	async revoke(token: string) {
		const item = store.get(token);
		if (item) item.revoked = true;
		store.set(token, item || { token, revoked: true });
	}

	async isRevoked(token: string) {
		const item = store.get(token);
		if (!item) return true;
		if (item.revoked) return true;
		if (item.expiresAt && Date.now() > item.expiresAt) return true;
		return false;
	}
}
