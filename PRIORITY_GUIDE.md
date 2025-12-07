# AI Task Planner - Önceliklendirme Rehberi

Bu belge, **AI Task Planner** uygulamasının görevleri nasıl puanladığını ve önceliklendirdiğini, özellikle "Acil Durum" ve "Yönetici İsteği" gibi durumların nasıl yönetilmesi gerektiğini açıklar.

## 🎯 Önceliklendirme Felsefesi

Uygulamamız, görevlerin önem sırasını belirlemek için **Hibrit Puanlama Sistemi** kullanır. Bu sistem, hem teknik gereklilikleri (mühendislik bakış açısı) hem de iş dünyasının gerçeklerini (yönetici/müşteri baskısı) dengelemeyi amaçlar.

Formülün temel mantığı şöyledir:
> **Toplam Skor** = (Teknik Şiddet) + (Zaman Aciliyeti) + (İş Faktörü / Manuel Müdahale)

---

## 📊 Puanlama Faktörleri

### 1. Teknik Şiddet (Severity)
Görevin sisteme olan teknik etkisini belirtir. Genellikle yazılımcı veya teknik lider tarafından belirlenir.

*   **Critical (Kritik)**: Sistem çalışmıyor, veri kaybı var, güvenlik açığı. (Yüksek Puan)
*   **Major (Önemli)**: Ana fonksiyonlardan biri çalışmıyor ama workaround var. (Orta Puan)
*   **Minor (Düşük)**: Kozmetik hatalar, küçük iyileştirmeler. (Düşük Puan)

### 2. Zaman Aciliyeti (Urgency)
Bitiş tarihine (Due Date) ne kadar kaldığına göre dinamik olarak hesaplanır.

*   **Gecikmiş (Overdue)**: Tarihi geçmiş işler en yüksek çarpanı alır.
*   **Bugün/Yarın**: Yüksek çarpan alır.
*   **İleri Tarihli**: Düşük veya nötr etki eder.

### 3. İş Faktörü / Manuel Müdahale (Manual Priority)
Burası "insan faktörünün" devreye girdiği yerdir. Yöneticilerin, müşterilerin veya piyasa koşullarının dayattığı aciliyeti temsil eder. `0-5` arasında bir değer alır ve skoru **agresif bir şekilde** etkiler.

---

## 🔥 "Yangın Yeri" ve Yönetici İstekleri Yönetimi

Gerçek hayatta teknik olarak önemsiz görünen bir iş, politik veya ticari nedenlerle "hemen şimdi" yapılması gerekebilir.

**Örnek Senaryo:**
> Bir butondaki yazım hatası teknik olarak **Minor** bir hatadır. Ancak bu buton CEO'nun yatırımcı sunumunda kullanacağı ana ekrandaysa, bu iş bir anda **Critical** seviyesinin üzerine çıkar.

Bu durumları yönetmek için **Manual Priority (0-5)** alanını şu stratejiyle kullanmalısınız:

### Puanlama Cetveli

| Puan | Tanım | Senaryo / Kullanım Durumu | Etki |
| :--- | :--- | :--- | :--- |
| **0** | **Standart** | Normal akış. Özel bir aciliyet yok. | Etkisiz |
| **1-2**| **Dikkat** | "Bunu öne alsak iyi olur." | Hafif Yükseltme |
| **3** | **Yönetici İsteği** | "X Müdürü bunu sordu", "Müşteri bekliyor". | Belirgin Yükseltme |
| **4** | **Çok Kritik** | Yarına yetişmesi şart, proje durabilir. | Yüksek Öncelik |
| **5** | **YANGIN YERİ (🔥)** | "Ortalık yanıyor", "Her şeyi bırak buna bak". | **En Tepeye Fırlatır** |

### Stratejik Not
**Puan 5 (Yangın Yeri)**, teknik şiddeti ne olursa olsun görevi listenin en tepesine taşımak için tasarlanmıştır. Bu gücü dikkatli kullanın; eğer her şeye "5" verirseniz, hiçbir şeyin önceliği kalmaz.
