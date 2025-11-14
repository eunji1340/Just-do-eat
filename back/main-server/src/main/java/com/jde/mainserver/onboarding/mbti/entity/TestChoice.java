package com.jde.mainserver.onboarding.mbti.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "test_choice")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TestChoice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "question_id", nullable = false)
	private TestQuestion question;

	/** Choice code like 'A', 'B' */
	@Column(name = "code", nullable = false, length = 4)
	private String code;

	@Column(nullable = false)
	private String text;
}


