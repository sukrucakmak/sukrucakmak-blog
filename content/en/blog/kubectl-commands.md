---
title: Frequently Used kubectl Commands
description: "The kubectl commands that day-to-day Kubernetes work runs on — contexts, pods, deployments, logs, exec, port-forward, rollouts and troubleshooting."
date: 2026-10-26
tags: [kubernetes, devops, guide]
translation: /blog/kubectl-commands
---

## Introduction

`kubectl` is the command-line tool for talking to a Kubernetes cluster. From listing pods to updating deployments, reading logs to opening a shell in a container, nearly all daily work comes down to a few dozen commands. This post collects them in order of use.

The examples use `api` as the deployment name and `prod` as the namespace.

## 1. Cluster and context

If you work with more than one cluster, the first thing to know is which one you're connected to.

```bash
kubectl version                        # client and server version
kubectl cluster-info                   # API server address
kubectl config get-contexts            # all configured contexts
kubectl config current-context         # active context
kubectl config use-context prod-cluster
kubectl config set-context --current --namespace=prod   # default namespace
```

## 2. Listing resources

```bash
kubectl get pods                       # pods in the active namespace
kubectl get pods -n prod               # a specific namespace
kubectl get pods -A                    # all namespaces
kubectl get pods -o wide               # with node and IP
kubectl get pods -l app=api            # filter by label
kubectl get pods -w                    # watch changes live
kubectl get deploy,svc,ingress         # several resource types
kubectl get all -n prod
kubectl get pod api-7d9f-x2k -o yaml   # full resource definition
```

Short names save time: `po` (pods), `deploy`, `svc`, `ns`, `cm` (configmap), `ing` (ingress), `no` (nodes).

## 3. Details and events

```bash
kubectl describe pod api-7d9f-x2k      # status, events, containers
kubectl describe deploy api
kubectl get events -n prod --sort-by=.lastTimestamp
kubectl explain deployment.spec.strategy   # field documentation
```

When a pod is `Pending`, `CrashLoopBackOff` or `ImagePullBackOff`, the cause is almost always in the **Events** section at the bottom of `describe`.

## 4. Create, update, delete

```bash
kubectl apply -f deployment.yaml       # create or update
kubectl apply -f k8s/                  # every manifest in a folder
kubectl diff -f deployment.yaml        # see the diff before applying
kubectl delete -f deployment.yaml
kubectl delete pod api-7d9f-x2k        # the deployment starts a new one
kubectl create deployment api --image=nginx:1.27
kubectl create deployment api --image=nginx:1.27 --dry-run=client -o yaml > deployment.yaml
```

The last command is the fastest way to get a YAML skeleton instead of writing one from scratch.

## 5. Logs, exec and port-forward

```bash
kubectl logs api-7d9f-x2k              # pod logs
kubectl logs -f api-7d9f-x2k           # follow
kubectl logs api-7d9f-x2k -c sidecar   # a specific container in a multi-container pod
kubectl logs api-7d9f-x2k --previous   # logs of the previous, crashed container
kubectl logs deploy/api --tail=100     # logs of one of the deployment's pods
kubectl logs -l app=api --since=1h

kubectl exec -it api-7d9f-x2k -- sh    # open a shell in the container
kubectl exec api-7d9f-x2k -- env       # run a single command

kubectl port-forward svc/api 8080:80   # localhost:8080 → service port 80
kubectl port-forward pod/api-7d9f-x2k 5005:5005

kubectl cp api-7d9f-x2k:/app/logs/app.log ./app.log
```

`--previous` is the only way to see why a pod in `CrashLoopBackOff` crashed.

## 6. Managing deployments

```bash
kubectl scale deploy api --replicas=5
kubectl set image deploy/api api=registry.local/api:1.4.2
kubectl rollout status deploy/api      # is the update finished?
kubectl rollout history deploy/api
kubectl rollout undo deploy/api        # roll back to the previous revision
kubectl rollout undo deploy/api --to-revision=3
kubectl rollout restart deploy/api     # restart all pods one by one
kubectl autoscale deploy api --min=2 --max=10 --cpu-percent=70
```

`rollout restart` is the cleanest way to make pods pick up a changed ConfigMap or Secret.

## 7. ConfigMaps and Secrets

```bash
kubectl create configmap api-config --from-file=application.yaml
kubectl create configmap api-config --from-literal=LOG_LEVEL=info
kubectl create secret generic db-secret --from-literal=password='S3cret!'
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d
```

> Secret values are only base64-encoded, not encrypted. Don't commit plain Secret manifests; use something like Sealed Secrets or External Secrets.

## 8. Resource usage and nodes

```bash
kubectl top nodes                      # requires metrics-server
kubectl top pods -n prod --sort-by=memory
kubectl get nodes -o wide
kubectl cordon node-1                  # stop scheduling new pods
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data   # empty it for maintenance
kubectl uncordon node-1
```

## 9. Troubleshooting summary

| Situation | Where to look |
| --- | --- |
| `Pending` | `kubectl describe pod` → Events: insufficient resources, PVC, node selector |
| `ImagePullBackOff` | Image name/tag, registry access, `imagePullSecrets` |
| `CrashLoopBackOff` | `kubectl logs --previous`, liveness probe, missing env |
| `OOMKilled` | `describe` → Last State; raise the memory limit or find the leak |
| Service unreachable | `kubectl get endpoints api` — does the label selector match? |

A throwaway debug pod also solves most network issues quickly:

```bash
kubectl run debug --rm -it --image=busybox -- sh
# inside: nslookup api.prod.svc.cluster.local, wget -qO- http://api
```

## Conclusion

Most day-to-day Kubernetes work comes down to `get`, `describe`, `logs`, `exec`, `apply` and `rollout`. When something breaks, the order is always the same: see the state with `get`, read the events with `describe`, and check what the app says with `logs --previous`. Adding `alias k=kubectl` and shell completion (`source <(kubectl completion bash)`) also saves hundreds of keystrokes a day.
