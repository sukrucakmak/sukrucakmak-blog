---
title: Her Geliştiricinin Bilmesi Gereken Git Komutları
description: Günlük işin yaklaşık 20 komutla döndüğü Git'in temel komutları — kullanım sırasıyla, örnekleriyle.
date: 2026-10-09
tags: [git, rehber]
translation: /en/blog/git-commands-every-developer-should-know
---

## Giriş

Git'te günlük işin büyük kısmı yaklaşık 20 komutla yapılır; bu yazı o komutları kullanım sırasıyla, örnekleriyle topluyor. İster yeni başlıyor olun ister yıllardır kullanıyor olun, `reset` ile `revert` arasındaki farkı ya da kaybolmuş bir commit'i nasıl geri getireceğinizi hızlıca hatırlamak için bu sayfayı yer imlerine ekleyebilirsiniz.

Örneklerde `main` ana branch, `origin` ise uzak repo adı olarak kullanılıyor.

## 1. Kurulum ve yapılandırma

Git'i ilk kurduğunuzda kimliğinizi bir kez tanıtmanız yeterli; bu bilgiler her commit'e yazılır.

```bash
git config --global user.name "Ad Soyad"
git config --global user.email "ad@ornek.com"
git config --global init.defaultBranch main
git config --list          # tüm ayarları göster
```

Yeni bir proje başlatmak ya da var olan bir repoyu indirmek için:

```bash
git init                                   # bulunduğun klasörü repo yap
git clone https://github.com/kullanici/proje.git
git clone <url> yeni-klasor-adi            # farklı klasöre klonla
```

## 2. Günlük iş akışı

Değişiklikler üç aşamadan geçer: çalışma dizini → staging alanı (`add`) → repo geçmişi (`commit`).

```bash
git status                 # neler değişti, neler stage'de
git status -s              # kısa format

git add dosya.java         # tek dosyayı stage'e al
git add .                  # tüm değişiklikleri al
git add -p                 # değişiklikleri parça parça seçerek al

git commit -m "Login validasyonu eklendi"
git commit -am "Mesaj"     # takip edilen dosyaları add + commit
git commit --amend         # son commit'i düzelt (push etmeden önce!)
```

Neyin değiştiğini görmek için `diff`, geçmişe bakmak için `log` kullanılır:

```bash
git diff                   # stage'e alınmamış farklar
git diff --staged          # commit'lenecek farklar
git log --oneline --graph --all   # okunaklı branch geçmişi
git log -p dosya.java      # bir dosyanın değişim geçmişi
git show <commit>          # tek commit'in detayı
git blame dosya.java       # hangi satırı kim değiştirdi
```

## 3. Branch işlemleri

Her özellik veya hata düzeltmesi için ayrı bir branch açmak, `main`'i temiz tutmanın en kolay yoludur.

```bash
git branch                 # yerel branch'ler
git branch -a              # uzak branch'ler dahil
git switch -c feature/login     # yeni branch aç ve geç
git switch main                 # branch değiştir
git checkout -b feature/login   # eski sözdizimi, aynı iş
git branch -d feature/login     # birleşmiş branch'i sil
git branch -D feature/login     # zorla sil
```

Branch'leri birleştirmenin iki yolu var:

```bash
git switch main
git merge feature/login    # merge commit ile birleştir

git switch feature/login
git rebase main            # commit'leri main'in ucuna taşı
git rebase -i HEAD~3       # son 3 commit'i düzenle/birleştir (squash)
```

| Komut | Ne yapar | Ne zaman |
| --- | --- | --- |
| `merge` | Geçmişi korur, merge commit ekler | Paylaşılan branch'lerde |
| `rebase` | Geçmişi doğrusal hale getirir | Henüz push edilmemiş yerel branch'lerde |

Altın kural: başkalarının da kullandığı, push edilmiş bir branch'i rebase etmeyin.

Çakışma (conflict) olursa dosyaları düzeltip `git add` yapın, ardından `git merge --continue` veya `git rebase --continue` ile devam edin; vazgeçmek için `--abort`.

## 4. Uzak repo ile çalışma

`fetch` sadece indirir, `pull` indirip birleştirir; emin değilseniz önce `fetch` yapıp neyin geldiğine bakın.

```bash
git remote -v                          # bağlı uzak repolar
git remote add origin <url>            # uzak repo ekle

git fetch origin                       # değişiklikleri indir, birleştirme
git pull                               # fetch + merge
git pull --rebase                      # fetch + rebase (daha temiz geçmiş)

git push                               # mevcut branch'i gönder
git push -u origin feature/login       # ilk push, upstream'i ayarla
git push --force-with-lease            # rebase sonrası güvenli zorla push
git push origin --delete feature/login # uzak branch'i sil
```

`--force` yerine her zaman `--force-with-lease` kullanın: bu, siz son baktığınızdan beri başkası push ettiyse işlemi durdurur.

## 5. Hataları geri almak

Neyi geri almak istediğinize göre doğru komut değişir:

| Durum | Komut |
| --- | --- |
| Dosyadaki kaydedilmemiş değişikliği at | `git restore dosya.java` |
| Dosyayı stage'den çıkar | `git restore --staged dosya.java` |
| Son commit'i geri al, değişiklikler kalsın | `git reset --soft HEAD~1` |
| Son commit'i ve değişiklikleri tamamen sil | `git reset --hard HEAD~1` |
| Push edilmiş commit'i güvenle geri al | `git revert <commit>` |

`reset` geçmişi yeniden yazar, `revert` ise geri alan yeni bir commit ekler; paylaşılan branch'lerde her zaman `revert` kullanın.

Yarım kalan işi kenara koymak için `stash`:

```bash
git stash                      # değişiklikleri sakla
git stash push -m "yarım login"   # isimle sakla
git stash list                 # saklananları listele
git stash pop                  # son stash'i geri getir ve sil
git stash apply stash@{1}      # belirli stash'i uygula
```

Son çare `reflog`'dur: `reset --hard` sonrası "kaybolan" commit'ler bile burada görünür.

```bash
git reflog                     # HEAD'in gittiği her yer
git reset --hard HEAD@{2}      # o noktaya geri dön
```

## 6. Zaman kazandıran ipuçları

Sık yazdığınız komutlar için alias tanımlayın:

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.lg "log --oneline --graph --all"
# Artık: git st, git lg
```

Birkaç küçük alışkanlık da büyük fark yaratır:

- `.gitignore` dosyasını projenin ilk commit'inde ekleyin (`target/`, `*.class`, `.idea/` gibi).
- Commit mesajlarını emir kipiyle ve kısa yazın: "Login validasyonunu ekle".
- Hatanın hangi commit'le geldiğini bulmak için `git bisect` ile ikili arama yapın.
- Belirli bir commit'i başka branch'e taşımak için `git cherry-pick <commit>` kullanın.
- Sürümleri etiketlemek için `git tag -a v1.0 -m "İlk sürüm"` ve `git push --tags`.

## Sonuç

Bu komutların çoğunu ilk haftada ezberleyeceksiniz; `reflog` ve `revert` gibi kurtarıcılarıysa ihtiyaç anında hatırlamak için bu sayfaya döneceksiniz. En iyi pratik, risksiz bir deneme reposu açıp `reset`, `rebase` ve `stash` komutlarını orada kırarak öğrenmektir.
