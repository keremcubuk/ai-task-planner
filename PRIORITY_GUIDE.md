# AI Task Planner - Önceliklendirme Rehberi

Bu belge, **AI Task Planner** uygulamasının görevleri nasıl puanladığını ve önceliklendirdiğini, özellikle "Acil Durum" ve "Yönetici İsteği" gibi durumların nasıl yönetilmesi gerektiğini açıklar.

## 🎯 Önceliklendirme Felsefesi

Uygulamamız, görevlerin önem sırasını belirlemek için **Ağırlıklı Puanlama Sistemi** kullanır. Bu sistem, birden fazla faktörü ağırlıklandırılmış olarak değerlendirir ve her bir faktörün toplam puana etkisi önceden belirlenmiş ağırlıklarla çarpılarak hesaplanır.

Formülün temel mantığı şöyledir:
> **Toplam Skor** = 
> (Acil Faktörü × 3) + 
> (Bitiş Tarihi Faktörü × 2) + 
> (Geçiş Tarihi Faktörü × 4) + 
> (Görev Yaşı Faktörü × 1) + 
> (Manuel Öncelik × 5)

---

## 📊 Puanlama Faktörleri

### 1. Acil Faktörü (Severity) - Ağırlık: 3x
Görevin teknik önemini belirtir. Daha yüksek şiddet değerleri daha yüksek puan getirir.

*   **Critical (5)**: Sistem çalışmıyor, veri kaybı var, güvenlik açığı.
*   **Major (3)**: Ana fonksiyonlardan biri çalışmıyor ama workaround var.
*   **Minor (1)**: Kozmetik hatalar, küçük iyileştirmeler.

### 2. Bitiş Tarihi Faktörü (Due Date) - Ağırlık: 2x
Görevin bitiş tarihine göre hesaplanır. Yaklaşan veya geçmiş tarihler daha yüksek puan getirir.

*   **Geçmişte (1.0)**: Tarihi geçmiş görevler en yüksek puanı alır.
*   **Bugün (0.8)**: Bitiş tarihi bugün olan görevler.
*   **Yakın (0.6-0.2)**: Yaklaşan tarihler kademeli olarak azalan puan alır.
*   **Uzak (0.1)**: İleri tarihli görevler en düşük puanı alır.

### 3. Geçiş Tarihi Faktörü (Transition Date) - Ağırlık: 4x
Görevin son durum değişikliğinden bu yana geçen süreye göre hesaplanır. Uzun süredir bekleyen görevlere öncelik verir.

### 4. Görev Yaşı Faktörü (Task Age) - Ağırlık: 1x
Görevin oluşturulma tarihinden itibaren geçen süreyi ifade eder. 30 günü aşan görevler maksimum puanı alır.

*   **0-30 gün**: Normalize edilmiş değer (gün sayısı/30)
*   **30+ gün**: 1.0 (maksimum değer)

### 5. Manuel Öncelik (Manual Priority) - Ağırlık: 5x
Kullanıcı tarafından atanan öncelik değeri (0-5 arası). En güçlü etkiye sahip faktördür.

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
