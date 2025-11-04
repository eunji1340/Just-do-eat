/**
 * restaurants/repository/TagRepository.java
 * 태그 레포지토리
 * Author: Jang
 * Date: 2025-11-03
 *
 */

package com.JDE.mainserver.restaurants.repository;

import com.JDE.mainserver.restaurants.entity.Tag;
import com.JDE.mainserver.restaurants.entity.Tag.TagType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

	/** 태그명으로 단건 조회 */
	Optional<Tag> findByName(String name);

	/** 타입으로 조회 */
	List<Tag> findByType(TagType type);
}
