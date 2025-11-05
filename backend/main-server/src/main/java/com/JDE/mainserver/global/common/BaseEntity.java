/**
 * global/common/BaseEntity.java
 * 모든 엔티티의 기본 클래스 (생성시삭, 수정시각 자동 관리)
 * Author: Jang
 * Date: 2025-11-03
 */

package com.JDE.mainserver.global.common;

import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

	@CreatedDate
	@Column(name = "created_at", updatable = false, nullable = false)
	private Instant createdAt;

	@LastModifiedDate
	@Column(name = "updated_at")
	private Instant updatedAt;
}