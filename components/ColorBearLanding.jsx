import CheckoutForm from "@/components/CheckoutForm";
import CountdownTimer from "@/components/CountdownTimer";
import DemoVideoModal from "@/components/DemoVideoModal";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import GiftCarousel from "@/components/GiftCarousel";
import PublicHeader from "@/components/PublicHeader";
import StickyPromoBar from "@/components/StickyPromoBar";
import { assetList, assetUrl } from "@/lib/assets";
import { formatIdr } from "@/lib/format";

const galleryFallback = [
  "/uploads/colorbear-art/gallery-1.png",
  "/uploads/colorbear-art/gallery-2.png",
  "/uploads/colorbear-art/gallery-3.png",
  "/uploads/colorbear-art/gallery-4.png"
];

const showcaseQuestions = [
  {
    question: "Takut anak cepat bosan setelah paket datang?",
    answer: "Ada 20 proyek seni bertahap dari kelas 1-20, jadi anak punya aktivitas lanjutan dan tidak bingung mau membuat apa."
  },
  {
    question: "Butuh guru supaya anak bisa mengikuti kelasnya?",
    answer: "Materi dipandu karakter Miss Paopao dengan langkah yang mudah diikuti lewat HP atau tablet."
  },
  {
    question: "Hasil belajar anak bisa terlihat nyata?",
    answer: "Anak bisa mengumpulkan karya dan mendapatkan rasa bangga setiap kali menyelesaikan proyek."
  },
  {
    question: "Kurikulumnya serius atau hanya permainan biasa?",
    answer: "Aktivitas disusun bertahap untuk melatih warna, bentuk, imajinasi, dan kebiasaan berkarya di rumah."
  },
  {
    question: "Kenapa tidak beli alat gambar biasa saja?",
    answer: "ColorBear Art bukan hanya alat. Anak mendapat kit lengkap, kelas, panduan, dan ide aktivitas yang siap dipakai."
  }
];

export default function ColorBearLanding({ product }) {
  const gallery = assetList(product.gallery?.length ? product.gallery : galleryFallback);
  const heroImage = assetUrl(product.heroImage || gallery[0]);
  const giftImages = assetList(product.giftImages?.length ? product.giftImages : ["/uploads/colorbear-art/disney-dress-gift.png"]);
  const videoUrl = assetUrl(product.videoUrl);
  const videoPoster = assetUrl(product.videoPoster || heroImage);
  const price = formatIdr(product.price);
  const compareAtPrice = product.compareAtPrice ? formatIdr(product.compareAtPrice) : "";
  const ctaText = product.ctaText || "Langsung COD";
  const reviews = (product.reviews || []).map((review) => ({
    ...review,
    avatar: assetUrl(review.avatar)
  }));

  return (
    <main className="public-page colorbear-page">
      <PublicHeader locale="id" mode="account-only" />
      <article className="colorbear-shell">
        <section className="colorbear-hero">
          <div className="colorbear-hero-art">
            <img alt={product.title} className="colorbear-hero-img" src={heroImage} />
            <div className="colorbear-proof">
              <strong>20+</strong>
              <span>project kreatif</span>
            </div>
          </div>
          <div className="colorbear-hero-copy">
            <span className="colorbear-kicker">Promo peluncuran Indonesia</span>
            <h1>Mulai kelas seni anak di rumah dengan diskon 50% hari ini</h1>
            <p>
              Dapatkan ColorBear Art Kit lengkap, akses aplikasi interaktif, dan panduan project kreatif
              bertahap untuk anak usia 3-9 tahun.
            </p>
            <div className="colorbear-price-strip">
              <div className="colorbear-price-main">
                <span>Harga promo hari ini</span>
                <strong>{price}</strong>
                {compareAtPrice ? <small>Harga normal {compareAtPrice}</small> : null}
              </div>
              <div className="colorbear-price-side">
                <b>Diskon 50%</b>
                <CountdownTimer storageKey="colorbear-60-minute-promo" label="Promo berakhir" compact />
              </div>
              <div className="colorbear-price-gift">
                <span>Bonus</span>
                <GiftCarousel
                  compact
                  images={giftImages}
                  product={product}
                  alt="Gaun anak karakter Disney senilai Rp 200.000"
                  title="Bonus ekstra untuk order promo"
                  description="Gaun anak karakter Disney senilai Rp 200.000. Karena ini bonus, ukuran dan warna dikirim secara acak. Jika ingin request ukuran atau warna tertentu, hubungi Customer Service WhatsApp kami. Kami akan berusaha memenuhi permintaan Anda."
                />
              </div>
            </div>
            <div className="colorbear-actions">
              <a className="colorbear-primary" href="#checkout" data-analytics-event="hero_cta_click" data-analytics-placement="hero">
                {ctaText}
              </a>
              <a
                className="colorbear-secondary"
                href={videoUrl ? "#demo-video" : "#course-value"}
                data-analytics-event="demo_click"
                data-analytics-placement="hero"
                {...(videoUrl ? { "data-open-demo-video": true } : {})}
              >
                {videoUrl ? "Lihat Demo" : "Lihat Isi Kelas"}
              </a>
            </div>
          </div>
        </section>

        <section className="colorbear-band colorbear-problem">
          <div className="colorbear-problem-media">
            <img alt="ColorBear Art kit lengkap dengan kelas kreatif untuk anak" src={assetUrl("/uploads/colorbear-art/hero.png")} />
          </div>
          <h2>Kalau hanya beli alat gambar, anak sering bertanya: setelah ini bikin apa?</h2>
          <div className="colorbear-problem-grid">
            <p>Orang tua ingin anak punya aktivitas positif, tapi tidak selalu sempat menyiapkan ide.</p>
            <p>Kelas offline bagus, tapi perlu jadwal tetap, antar-jemput, dan biaya per sesi.</p>
            <p>ColorBear Art memberi sistem yang mudah: buka kelas, keluarkan alat, lalu ikuti arahan.</p>
          </div>
        </section>

        <section className="colorbear-band colorbear-showcase">
          <div className="colorbear-section-head">
            <span className="colorbear-kicker">Inside the box</span>
            <h2>Paket datang, anak bisa langsung mulai berkarya</h2>
          </div>
          <div className="colorbear-question-gallery">
            {gallery.slice(0, 5).map((image, index) => {
              const item = showcaseQuestions[index] || showcaseQuestions[showcaseQuestions.length - 1];
              return (
                <article className={index === 0 ? "question-card is-featured" : "question-card"} key={image}>
                  <div className="question-copy">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                  <img alt={`${product.title} - ${item.question}`} src={image} />
                </article>
              );
            })}
          </div>
        </section>

        {videoUrl ? (
          <DemoVideoModal videoUrl={videoUrl} poster={videoPoster} title={product.title} product={product} />
        ) : null}

        <section className="colorbear-band colorbear-benefits" id="course-value">
          <div className="colorbear-section-head">
            <span className="colorbear-kicker">Why parents buy</span>
            <h2>Nilainya bukan cuma alatnya banyak, tapi anak tahu harus mulai dari mana</h2>
          </div>
          <div className="colorbear-benefit-grid">
            <div>
              <strong>01</strong>
              <h3>Art kit + kelas</h3>
              <p>Bukan hanya alat. Anak punya arahan aktivitas yang jelas.</p>
            </div>
            <div>
              <strong>02</strong>
              <h3>Panduan step-by-step</h3>
              <p>Orang tua tidak harus jago gambar untuk mendampingi anak.</p>
            </div>
            <div>
              <strong>03</strong>
              <h3>Bisa lewat HP atau tablet</h3>
              <p>Bisa dibuka di Android maupun iOS, cocok untuk belajar dari rumah.</p>
            </div>
            <div>
              <strong>04</strong>
              <h3>Bisa pause dan ulang</h3>
              <p>Kalau belum selesai, lanjut besok. Kalau lupa, tinggal ulang lagi.</p>
            </div>
          </div>
        </section>

        <section className="colorbear-band colorbear-compare">
          <div>
            <span className="colorbear-kicker">Value comparison</span>
            <h2>Dibanding satu kali kelas offline, ini bisa dipakai berulang dari rumah</h2>
          </div>
          <div className="colorbear-compare-table" aria-label="Perbandingan ColorBear Art dan kelas gambar offline">
            <div>
              <strong>Kelas offline</strong>
              <span>Jadwal tetap, perlu datang ke tempat, satu sesi selesai di hari itu.</span>
            </div>
            <div>
              <strong>ColorBear Art</strong>
              <span>Alat + kelas + banyak project, bisa dibuka lagi kapan saja.</span>
            </div>
            <div>
              <strong>Lebih fleksibel</strong>
              <span>Mengurangi repot antar-jemput dan menyesuaikan mood anak.</span>
            </div>
          </div>
        </section>

        <section className="colorbear-band colorbear-usage-guide">
          <img alt="Panduan cepat aktivasi aplikasi dan kode kursus ColorBear Art" src={assetUrl("/uploads/colorbear-art/usage-guide.png")} />
          <div>
            <span className="colorbear-kicker">Panduan cepat</span>
            <h2>Mulai belajar dalam hitungan menit</h2>
            <p>
              Setelah paket diterima, orang tua cukup mengunduh aplikasi ColorBear Art, memasukkan kode
              kursus, lalu anak bisa langsung membuka materi dan mulai berkarya.
            </p>
            <ol className="usage-step-list">
              <li>Buka aplikasi ColorBear Art.</li>
              <li>Pilih menu tukar atau aktivasi kursus.</li>
              <li>Masukkan kode kursus dari paket.</li>
              <li>Mulai belajar dari HP atau tablet.</li>
            </ol>
          </div>
        </section>

        <section className="colorbear-band colorbear-reviews">
          <h2>Yang paling penting: anak mau terus mencoba</h2>
          <div className="colorbear-review-grid">
            {reviews.map((review) => (
              <figure key={`${review.name}-${review.text}`}>
                <figcaption className="review-person">
                  <span className="review-avatar">
                    {review.avatar ? <img alt={review.name} src={review.avatar} /> : review.name?.slice(0, 1) || "C"}
                  </span>
                  <span>
                    <strong>{review.name}</strong>
                    <ReviewStars rating={review.rating || 5} />
                  </span>
                </figcaption>
                <blockquote>{review.text}</blockquote>
              </figure>
            ))}
          </div>
        </section>

        <CheckoutForm product={product} locale="id" />
      </article>
      <FloatingWhatsAppButton />
      <StickyPromoBar price={price} compareAtPrice={compareAtPrice} ctaText={ctaText} product={product} />
    </main>
  );
}

function ReviewStars({ rating = 5 }) {
  const stars = Array.from({ length: 5 }, (_, index) => index < rating);

  return (
    <span className="colorbear-stars" aria-label={`${rating} dari 5 bintang`}>
      {stars.map((filled, index) => (
        <svg key={index} viewBox="0 0 24 24" aria-hidden="true" className={filled ? "is-filled" : ""}>
          <path d="M12 2.8l2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 16.86l-5.5 2.89 1.05-6.13-4.46-4.34 6.16-.9L12 2.8z" />
        </svg>
      ))}
    </span>
  );
}
