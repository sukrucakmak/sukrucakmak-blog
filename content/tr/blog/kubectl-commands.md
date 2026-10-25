---
title: Sık Kullanılan kubectl Komutları
description: "Kubernetes ile günlük işin döndüğü kubectl komutları — context, pod, deployment, log, exec, port-forward, rollout ve sorun giderme."
date: 2026-10-26
tags: [kubernetes, devops, rehber]
translation: /en/blog/kubectl-commands
---

## Giriş

`kubectl`, Kubernetes cluster'ı ile konuşmanın komut satırı aracıdır. Pod'ları listelemekten deployment güncellemeye, log okumaktan container'a bağlanmaya kadar günlük işin neredeyse tamamı birkaç düzine komutla yapılır. Bu yazı o komutları kullanım sırasıyla topluyor.

Örneklerde `api` deployment adı, `prod` namespace adı olarak kullanılıyor.

## 1. Cluster ve context

Birden fazla cluster ile çalışıyorsanız ilk iş hangi cluster'a bağlı olduğunuzu bilmektir.

```bash
kubectl version                        # istemci ve sunucu sürümü
kubectl cluster-info                   # API server adresi
kubectl config get-contexts            # tanımlı tüm context'ler
kubectl config current-context         # aktif context
kubectl config use-context prod-cluster
kubectl config set-context --current --namespace=prod   # varsayılan namespace
```

## 2. Kaynakları listeleme

```bash
kubectl get pods                       # aktif namespace'teki pod'lar
kubectl get pods -n prod               # belirli namespace
kubectl get pods -A                    # tüm namespace'ler
kubectl get pods -o wide               # node ve IP bilgisiyle
kubectl get pods -l app=api            # label'a göre filtrele
kubectl get pods -w                    # değişiklikleri canlı izle
kubectl get deploy,svc,ingress         # birden fazla kaynak tipi
kubectl get all -n prod
kubectl get pod api-7d9f-x2k -o yaml   # kaynağın tam tanımı
```

Kısaltmalar zaman kazandırır: `po` (pods), `deploy`, `svc`, `ns`, `cm` (configmap), `ing` (ingress), `no` (nodes).

## 3. Detay ve olaylar

```bash
kubectl describe pod api-7d9f-x2k      # durum, olaylar, container'lar
kubectl describe deploy api
kubectl get events -n prod --sort-by=.lastTimestamp
kubectl explain deployment.spec.strategy   # alanların dokümantasyonu
```

Pod `Pending`, `CrashLoopBackOff` ya da `ImagePullBackOff` durumundaysa sebebi neredeyse her zaman `describe` çıktısının en altındaki **Events** bölümündedir.

## 4. Oluşturma, güncelleme, silme

```bash
kubectl apply -f deployment.yaml       # oluştur ya da güncelle
kubectl apply -f k8s/                  # klasördeki tüm manifest'ler
kubectl diff -f deployment.yaml        # apply öncesi farkı gör
kubectl delete -f deployment.yaml
kubectl delete pod api-7d9f-x2k        # pod silinir, deployment yenisini açar
kubectl create deployment api --image=nginx:1.27
kubectl create deployment api --image=nginx:1.27 --dry-run=client -o yaml > deployment.yaml
```

Son komut sıfırdan YAML yazmak yerine iskelet üretmenin en hızlı yoludur.

## 5. Log, exec ve port-forward

```bash
kubectl logs api-7d9f-x2k              # pod logları
kubectl logs -f api-7d9f-x2k           # canlı takip
kubectl logs api-7d9f-x2k -c sidecar   # çok container'lı pod'da belirli container
kubectl logs api-7d9f-x2k --previous   # çöken önceki container'ın logları
kubectl logs deploy/api --tail=100     # deployment'tan bir pod'un logları
kubectl logs -l app=api --since=1h

kubectl exec -it api-7d9f-x2k -- sh    # container'a bağlan
kubectl exec api-7d9f-x2k -- env       # tek komut çalıştır

kubectl port-forward svc/api 8080:80   # localhost:8080 → service 80
kubectl port-forward pod/api-7d9f-x2k 5005:5005

kubectl cp api-7d9f-x2k:/app/logs/app.log ./app.log
```

`--previous`, `CrashLoopBackOff` durumundaki bir pod'un neden çöktüğünü görmenin tek yoludur.

## 6. Deployment yönetimi

```bash
kubectl scale deploy api --replicas=5
kubectl set image deploy/api api=registry.local/api:1.4.2
kubectl rollout status deploy/api      # güncelleme bitti mi?
kubectl rollout history deploy/api
kubectl rollout undo deploy/api        # bir önceki sürüme dön
kubectl rollout undo deploy/api --to-revision=3
kubectl rollout restart deploy/api     # tüm pod'ları sırayla yenile
kubectl autoscale deploy api --min=2 --max=10 --cpu-percent=70
```

`rollout restart`, ConfigMap ya da Secret değiştirdikten sonra pod'ların yeni değerleri okuması için en temiz yoldur.

## 7. ConfigMap ve Secret

```bash
kubectl create configmap api-config --from-file=application.yaml
kubectl create configmap api-config --from-literal=LOG_LEVEL=info
kubectl create secret generic db-secret --from-literal=password='S3cret!'
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d
```

> Secret değerleri sadece base64 ile kodlanır, şifrelenmez. Repo'ya düz Secret manifest'i koymayın; Sealed Secrets ya da External Secrets gibi bir çözüm kullanın.

## 8. Kaynak kullanımı ve node'lar

```bash
kubectl top nodes                      # metrics-server gerekir
kubectl top pods -n prod --sort-by=memory
kubectl get nodes -o wide
kubectl cordon node-1                  # yeni pod alma
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data   # bakım için boşalt
kubectl uncordon node-1
```

## 9. Sorun giderme özeti

| Durum | Bakılacak yer |
| --- | --- |
| `Pending` | `kubectl describe pod` → Events: yetersiz kaynak, PVC, node selector |
| `ImagePullBackOff` | Image adı/tag'i, registry erişimi, `imagePullSecrets` |
| `CrashLoopBackOff` | `kubectl logs --previous`, liveness probe, eksik env |
| `OOMKilled` | `describe` → Last State; memory limit'ini artırın ya da sızıntıyı bulun |
| Service'e erişilemiyor | `kubectl get endpoints api`, label selector eşleşiyor mu |

Geçici bir debug pod'u da çoğu ağ sorununu hızlıca çözer:

```bash
kubectl run debug --rm -it --image=busybox -- sh
# içeride: nslookup api.prod.svc.cluster.local, wget -qO- http://api
```

## Sonuç

Günlük Kubernetes işinin büyük kısmı `get`, `describe`, `logs`, `exec`, `apply` ve `rollout` ile döner. Bir sorunla karşılaştığınızda sıra hep aynıdır: `get` ile durumu görün, `describe` ile olayları okuyun, `logs --previous` ile uygulamanın ne dediğine bakın. `alias k=kubectl` ve shell completion (`source <(kubectl completion bash)`) eklemek de günde yüzlerce tuş vuruşu kazandırır.
