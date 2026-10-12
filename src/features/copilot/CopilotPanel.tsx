export function CopilotPanel() {
  return (
    <section className="copilot" aria-labelledby="copilot-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PARTNER BERCERITA</span>
          <h2 id="copilot-title">Copilot</h2>
        </div>
        <span className="copilot-symbol" aria-hidden="true">
          ✳
        </span>
      </div>
      <div className="copilot-intro">
        <p>Ide Anda. Arah cerita Anda.</p>
        <span>
          Hubungkan ChatGPT untuk mulai mengembangkan naskah dan merencanakan adegan bersama.
        </span>
      </div>
      <div className="connection-note">
        <strong>Belum terhubung</strong>
        <p>
          Login ChatGPT belum tersedia pada fondasi ini. Penggunaan kuota perlu dibuktikan sebelum
          percakapan diaktifkan.
        </p>
      </div>
      <label htmlFor="message">Pesan untuk copilot</label>
      <textarea
        id="message"
        disabled
        placeholder="Menunggu koneksi ChatGPT…"
        rows={3}
        aria-describedby="chat-help"
      />
      <div className="composer-footer">
        <span id="chat-help">Memakai paket ChatGPT</span>
        <button className="button primary" disabled>
          Kirim ↑
        </button>
      </div>
    </section>
  );
}
